import { MetaComponent } from "../metaComponent/metaComponent";
import { TemplateFiles } from "../types";

import { CSSTemplate } from "./CSS/CSS";
import { HTMLTemplate } from "./HTML/HTML";
import { ReactTemplate } from "./React/React";
import { ReactStyledComponentsTemplate } from "./ReactStyledComponents/ReactStyledComponents";
import { Template, OnConstructor } from "./Template";

type MakeTemplatesProps = {
  templateId: string;
  metaComponent: MetaComponent;
};

export function makeTemplates({
  templateId,
  metaComponent,
}: MakeTemplatesProps): TemplateFiles {
  const args: OnConstructor = {
    props: metaComponent.props,
    templateId,
    hasMultipleRootNodes: metaComponent.nodes.length > 1,
  };
  return mergeTemplateFiles(
    makeTemplate(templateId, metaComponent, new HTMLTemplate(args)),
    makeTemplate(templateId, metaComponent, new CSSTemplate(args)),
    makeTemplate(templateId, metaComponent, new ReactTemplate(args)),
    makeTemplate(
      templateId,
      metaComponent,
      new ReactStyledComponentsTemplate(args)
    )
  );
}

function mergeTemplateFiles(...obj: TemplateFiles[]): TemplateFiles {
  return Object.assign({}, ...obj);
}

function makeTemplate(
  templateId: string,
  metaComponent: MetaComponent,
  instance: Template
) {
  function walk(node: MetaComponent["nodes"][number]) {
    switch (node.type) {
      case "Element": {
        const openingElement = instance.onElement(node);
        if (node.children.length > 0) {
          node.children.forEach(walk);
          instance.onCloseElement({ openingElement });
        }
        break;
      }
      case "Text": {
        instance.onText(node);
        break;
      }
      case "Comment": {
        instance.onComment(node);
        break;
      }
      case "Variable": {
        instance.onVariable(node);
        node.children.forEach(walk);
        instance.onCloseVariable(node);
        break;
      }
      case "If": {
        instance.onIf(node);
        node.children.forEach(walk);
        instance.onCloseIf();
        break;
      }
    }
  }

  metaComponent.nodes.forEach(walk);

  instance.onFinalise();

  return instance.serialize({ css: metaComponent.cssString });
}
