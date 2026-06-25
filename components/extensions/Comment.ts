import { Mark, mergeAttributes } from "@tiptap/core";

interface CommentAttrs {
  id: string;
  text: string;
  author: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      setComment: (attrs: CommentAttrs) => ReturnType;
      unsetComment: () => ReturnType;
    };
  }
}

/** An anchored comment mark — wraps a span of text, renders a subtle highlight +
 *  a 💬 icon at the end; hovering reveals the comment (see CommentTooltip). */
export const Comment = Mark.create({
  name: "comment",
  inclusive: false,
  excludes: "",

  addAttributes() {
    return {
      id: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute("data-comment-id") },
      text: { default: "", parseHTML: (el: HTMLElement) => decodeURIComponent(el.getAttribute("data-comment") || "") },
      author: { default: "", parseHTML: (el: HTMLElement) => el.getAttribute("data-comment-by") || "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const h = HTMLAttributes as Record<string, unknown>;
    return [
      "span",
      mergeAttributes({
        "data-comment-id": (h.id as string) ?? "",
        "data-comment": encodeURIComponent((h.text as string) ?? ""),
        "data-comment-by": (h.author as string) ?? "",
        class: "has-comment",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      unsetComment:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
