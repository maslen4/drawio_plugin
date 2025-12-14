import fs from "node:fs";
import { readFileSync } from "node:fs";

const classStyle = "swimlane;fontStyle=2;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeLast=0;collapsible=1;marginBottom=0;rounded=0;shadow=0;strokeWidth=1;editable=1;movable=1;resizable=1;rotatable=1;deletable=1;locked=0;connectable=1;fillColor=#f5f5f5;fontColor=#333333;strokeColor=#666666;"
const attributeStyle = "text;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=1;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;editable=1;movable=1;resizable=1;deletable=1;locked=0;connectable=1;fontStyle=0;fillColor=#f5f5f5;fontColor=#333333;strokeColor=#666666;";
const methodStyle ="text;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=1;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;editable=1;movable=1;resizable=1;deletable=1;locked=0;connectable=1;fontStyle=0;fillColor=#f5f5f5;fontColor=#333333;strokeColor=#666666;"; 

function jsonToDrawioXml(diagram) {
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;")
                                   .replace(/</g, "&lt;")
                                   .replace(/"/g, "&quot;");

  const cells = [];

  const classesAndInterfaces = [...diagram.classes, ...diagram.interfaces];
  //const classesAndInterfaces = [];
  // Classes
  for (const cls of classesAndInterfaces) {
    const name = Object.keys(cls)[0];
    //console.log(name);
    const xValue = cls[name].layout.x;
    const yValue = cls[name].layout.y;
    const widthValue = cls[name].layout.width;
    const heightValue = cls[name].layout.height;

    // Class cell
    cells.push(`
      <mxCell id="${esc(name)}" value="${esc(name)}"
              style="${classStyle}fontSize=${diagram.layoutConfig.charWidth};"
              vertex="1" parent="class_diagram">
        <mxGeometry x="${xValue}" y="${yValue}"
                    width="${widthValue}" height="${heightValue}"
                    as="geometry"/>
      </mxCell>`.trim());

    var y = 30;
    const increment = diagram.layoutConfig.lineHeight;

    // Attributes
    for (const attribute of cls[name].attributes) {
      const attributeName = Object.keys(attribute)[0];
      //console.log(esc(name + "_" + attributeName));
        cells.push(`
        <mxCell id="${esc(name + "_" + attributeName)}" value="${esc(attributeName + ':' + attribute[attributeName].type)}"
                style="${attributeStyle}fontSize=${diagram.layoutConfig.charWidth};"
                vertex="1" parent="${esc(name)}">
            <mxGeometry y="${y}" width="${widthValue}" height="${increment}" as="geometry"/>
        </mxCell>`.trim());
        y += increment;
    }

    y += 5; // Small gap between attributes and methods

    // Methods
    for (const method of cls[name].methods) {
      const methodName = Object.keys(method)[0];
      //console.log(esc(name + "_" + methodName + "()"));
      var parameters = "";
      for (const param of method[methodName].parameters) {
        const paramName = Object.keys(param)[0];
        parameters += paramName + ':' + param[paramName] + ', ';
      }
      if (parameters.length > 2) {
        parameters = parameters.slice(0, -2);
      }

      cells.push(`
        <mxCell id="${esc(name + "_" + methodName + "()")}" value="${esc(methodName + '(' + parameters + '):' + method[methodName].returnType)}"
                style="${methodStyle}fontSize=${diagram.layoutConfig.charWidth};"
                vertex="1" parent="${esc(name)}">
          <mxGeometry y="${y}" width="${widthValue}" height="${increment}" as="geometry"/>
        </mxCell>`.trim());
        y += increment;
    }
  }

    // Associations
  for (const relations of diagram.relationEndpoints.associations) {
    //const from = Object.keys(relations)[0];
    //console.log(relations.pFrom.x);
    const associationName = "association" + relations.from + "_" + relations.to;
    cells.push(`
        <mxCell id="${esc(associationName)}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=open;endFill=0;strokeColor=#666666;" parent="class_diagram" source="${esc(relations.from)}" target="${esc(relations.to)}" edge="1">
          <mxGeometry x="-0.0909" y="9" relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="${esc(relations.pFrom.x)}" y="${esc(relations.pFrom.y)}" />
              <mxPoint x="${esc(relations.pTo.x)}" y="${esc(relations.pTo.y)}" />
            </Array>
            <mxPoint as="offset" />
          </mxGeometry>
        </mxCell>`.trim());
  }

    // Inheritances
  for (const relations of diagram.relationEndpoints.inheritances) {
    const inheritanceName = "inheritance" + relations.from + "_" + relations.to;
    cells.push(`
        <mxCell id="${esc(inheritanceName)}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=blockThin;endFill=0;strokeColor=#666666;" parent="class_diagram" source="${esc(relations.from)}" target="${esc(relations.to)}" edge="1">
          <mxGeometry x="-0.0909" y="9" relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="${esc(relations.pFrom.x)}" y="${esc(relations.pFrom.y)}" />
              <mxPoint x="${esc(relations.pTo.x)}" y="${esc(relations.pTo.y)}" />
            </Array>
            <mxPoint as="offset" />
          </mxGeometry>
        </mxCell>`.trim());
  }

  return `
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="class_diagram" value="classDiagram" parent="0"/>
    ${cells.join("\n    ")}
  </root>
</mxGraphModel>`.trim();
}


const raw = readFileSync("adit-java-karin-out.json", "utf8");
const diagram = JSON.parse(raw);
const res = jsonToDrawioXml(diagram);
//console.log(res);
fs.writeFileSync("dummy.drawio", res, "utf8");
