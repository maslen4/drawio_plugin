import fs from "fs";
import { readFileSync } from "fs";

function jsonToDrawioXmlSequence(diagram) {
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;")
                                   .replace(/</g, "&lt;")
                                   .replace(/"/g, "&quot;");

  const cells = [];
  for (const lifelineName of Object.keys(diagram.lifelines)) {
    const xLifeline = diagram.lifelines[lifelineName];
    cells.push(
      `<mxCell id="${esc(lifelineName)}" value="${esc(lifelineName)}" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;container=0;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;size=65;fillColor=#f5f5f5;fontColor=#333333;strokeColor=#666666;" `+
      `vertex="1" parent="sequence_diagram">` +
        `<mxGeometry x="${xLifeline}" y="0" width="130" height="1000" as="geometry"/>` +
        `</mxCell>`
    );
  }

  for (const activationBlockLifeline of Object.keys(diagram.activationBlocks)) {
    var idx = 0;
    for (const activationBlock of diagram.activationBlocks[activationBlockLifeline]) {
        const startY = activationBlock.startY;
        const endY = activationBlock.endY;
        const lifelineX = 0;
        cells.push(
            `<mxCell id="${activationBlockLifeline + "_" + idx}" value="" style="shape=umlActivation;perimeter=rectanglePerimeter;whiteSpace=wrap;container=0;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#f5f5f5;fontColor=#333333;strokeColor=#333333;" `+
            `vertex="1" parent="${esc(activationBlockLifeline)}">` +
                `<mxGeometry x="${lifelineX+55}" y="${startY}" width="20" height="${endY - startY}" as="geometry"/>` +
            `</mxCell>`
        );
        idx += 1;
    }
  }

  for (const message of diagram.messages) {
    const index = message.index;
    const start = message.start;
    const end = message.end;
    const from = message.from;
    const to = message.to;
    const name = message.name;
    const y = message.y;


    cells.push(`
        <mxCell id="message_${index}_${from}_${to}" value="${name}" edge="1" parent="sequence_diagram"
                style="endArrow=open;startArrow=none;rounded=0;strokeColor=#333333;">
        <mxGeometry as="geometry">
            <mxPoint x="${start+55}" y="${y}" as="sourcePoint"/>
            <mxPoint x="${end+55}" y="${y}" as="targetPoint"/>
        </mxGeometry>
        </mxCell>
`.trim()
    );
  }



  return `
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="sequence_diagram" value="sequenceDiagram" parent="0"/>
    ${cells.join("\n    ")}
  </root>
</mxGraphModel>`.trim();
}

const raw = readFileSync("example.JSON", "utf8");
const diagram = JSON.parse(raw);
const res = jsonToDrawioXmlSequence(diagram);
fs.writeFileSync("seq.drawio", res, "utf8");