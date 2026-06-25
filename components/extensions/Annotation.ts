import { Mark, mergeAttributes } from "@tiptap/core";

interface AnnotationAttrs {
  color: string;
  by?: string;
  assigned?: boolean;
  taskId?: string;
  initial?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    annotation: {
      setAnnotation: (attrs: AnnotationAttrs) => ReturnType;
      toggleAnnotation: (attrs: AnnotationAttrs) => ReturnType;
      unsetAnnotation: () => ReturnType;
    };
  }
}

/**
 * Non-destructive pen/annotation mark. Renders as a colored underline (or a
 * tinted background when it represents an author-assigned edit request). Carries
 * the annotator's identity so the context menu can act on it.
 */
export const Annotation = Mark.create({
  name: "annotation",
  inclusive: false,
  excludes: "",

  addAttributes() {
    return {
      color: {
        default: "#7f77dd",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-color") || "#7f77dd",
      },
      by: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-by") || null,
      },
      assigned: {
        default: false,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-assigned") === "true",
      },
      taskId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-task") || null,
      },
      initial: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-initial") || null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-annotation]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const h = HTMLAttributes as Record<string, unknown>;
    const c = typeof h.color === "string" ? h.color : "#7f77dd";
    const assigned = !!h.assigned;
    const initial = ((h.initial as string) ?? "•").slice(0, 1).replace(/['"\\]/g, "");
    const style = assigned
      ? `background:${c}22;border-bottom:2px solid ${c};border-radius:2px;--dot:${c};--ini:'${initial}';`
      : `text-decoration:underline;text-decoration-color:${c};text-decoration-thickness:2px;text-underline-offset:3px;`;
    const attrs: Record<string, string> = {
      "data-annotation": "",
      "data-color": c,
      "data-by": (h.by as string) ?? "",
      style,
    };
    if (assigned) {
      attrs["data-assigned"] = "true";
      attrs["data-task"] = (h.taskId as string) ?? "";
      attrs["data-initial"] = initial;
    }
    return ["span", mergeAttributes(attrs), 0];
  },

  addCommands() {
    return {
      setAnnotation:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      toggleAnnotation:
        (attrs) =>
        ({ commands }) =>
          commands.toggleMark(this.name, attrs),
      unsetAnnotation:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
