import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

/** Common typo → fix map (lowercase keys). */
const TYPOS: Record<string, string> = {
  teh: "the", thsi: "this", taht: "that", adn: "and", nad: "and", ot: "to", fo: "of",
  recieve: "receive", recieved: "received", beleive: "believe", definately: "definitely",
  seperate: "separate", occured: "occurred", occurence: "occurrence", untill: "until",
  alot: "a lot", wich: "which", wiht: "with", waht: "what", wokr: "work", woudl: "would",
  coudl: "could", shoudl: "should", dont: "don't", cant: "can't", wont: "won't",
  isnt: "isn't", arent: "aren't", wasnt: "wasn't", doesnt: "doesn't", didnt: "didn't",
  couldnt: "couldn't", shouldnt: "shouldn't", wouldnt: "wouldn't", im: "I'm", ive: "I've",
  im_: "I'm", youre: "you're", theyre: "they're", thier: "their", freind: "friend",
  becuase: "because", becasue: "because", enviroment: "environment", goverment: "government",
  neccessary: "necessary", accross: "across", aparent: "apparent", arguement: "argument",
  calender: "calendar", concious: "conscious", embarass: "embarrass", existance: "existence",
  grammer: "grammar", independant: "independent", occassion: "occasion", priviledge: "privilege",
  publically: "publicly", reccomend: "recommend", refered: "referred", relevent: "relevant",
  succesful: "successful", tommorow: "tomorrow", truely: "truly", wierd: "weird", yuo: "you",
  hte: "the", tihs: "this", finaly: "finally",
};

function matchCase(src: string, repl: string): string {
  if (src.length > 1 && src === src.toUpperCase()) return repl.toUpperCase();
  if (src[0] === src[0]?.toUpperCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
  return repl;
}

declare module "@tiptap/core" {
  interface Storage {
    autocorrect: { enabled: boolean };
  }
}

/** Live autocorrect: fixes common typos, capitalizes "i", and capitalizes the
 *  first word of a sentence — applied when a word-boundary char is typed.
 *  Gated by `editor.storage.autocorrect.enabled` (synced from the store). */
export const Autocorrect = Extension.create({
  name: "autocorrect",

  addStorage() {
    return { enabled: true };
  },

  addProseMirrorPlugins() {
    const ext = this;
    return [
      new Plugin({
        // Runs after every edit — corrects the word just completed when a
        // boundary char is typed. Works for real typing AND programmatic input.
        appendTransaction(trs, _oldState, newState) {
          if (!ext.storage.enabled) return null;
          if (trs.some((t) => t.getMeta("autocorrect"))) return null;
          if (!trs.some((t) => t.docChanged)) return null;
          const sel = newState.selection;
          if (!sel.empty) return null;
          const pos = sel.head;
          if (pos < 2) return null;
          const boundary = newState.doc.textBetween(pos - 1, pos);
          if (!/^[\s.,!?;:)]$/.test(boundary)) return null;
          const $b = newState.doc.resolve(pos - 1);
          if ($b.parent.type.name === "codeBlock") return null;
          const blockStart = $b.start();
          const before = newState.doc.textBetween(blockStart, pos - 1, "\n", " ");
          const m = before.match(/([A-Za-z']+)$/);
          if (!m) return null;
          const word = m[1];
          const wordStart = pos - 1 - word.length;
          const lower = word.toLowerCase();

          let fixed: string | null = null;
          if (TYPOS[lower]) fixed = matchCase(word, TYPOS[lower]);
          else if (lower === "i") fixed = "I";
          if (!fixed) {
            const preceding = before.slice(0, before.length - word.length);
            const sentenceStart = preceding.trim() === "" || /[.!?]["')\]]?\s*$/.test(preceding);
            if (sentenceStart && word[0] >= "a" && word[0] <= "z") fixed = word.charAt(0).toUpperCase() + word.slice(1);
          }
          if (!fixed || fixed === word) return null;
          return newState.tr.insertText(fixed, wordStart, pos - 1).setMeta("autocorrect", true);
        },
      }),
    ];
  },
});
