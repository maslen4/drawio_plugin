import fs from "fs";
import path from "path";
import { parse } from "java-parser";

function listJavaFiles(dir) {
    const files = fs.readdirSync(dir);
    let results = [];

    for (const file of files) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);

        if (stat.isDirectory()) {
            results = results.concat(listJavaFiles(full));
        } else if (file.endsWith(".java")) {
            results.push(full);
        }
    }
    return results;
}

function getTypeOfNode(node) {
    //console.log(node);
    var fieldType = node;
    if ("unannPrimitiveTypeWithOptionalDimsSuffix" in fieldType) { // It is a primitive type
        fieldType = fieldType.unannPrimitiveTypeWithOptionalDimsSuffix[0].children.unannPrimitiveType[0].children;
        if ("Boolean" in fieldType) {
            fieldType = fieldType.Boolean[0].image;  // <--- boolean type
        } else if ("numericType" in fieldType) {
            fieldType = fieldType.numericType[0].children;
            if ("integralType" in fieldType) {
                fieldType = fieldType.integralType[0].children;
                if ("Int" in fieldType) {
                    fieldType = fieldType.Int[0].image;  // <--- int type
                } else if ("Long" in fieldType) {
                    fieldType = fieldType.Long[0].image;  // <--- long type
                } else if ("Char" in fieldType) {
                    fieldType = fieldType.Char[0].image;  // <--- char type
                } else if ("Short" in fieldType) {
                    fieldType = fieldType.Short[0].image;  // <--- short type
                } else if ("Byte" in fieldType) {
                    fieldType = fieldType.Byte[0].image;  // <--- byte type
                } else {
                    console.log("Unknown integral type");
                }

            } else if ("floatingPointType" in fieldType) {
                fieldType = fieldType.floatingPointType[0].children;
                if ("Float" in fieldType) {
                    fieldType = fieldType.Float[0].image;  // <--- float type
                } else if ("Double" in fieldType) {
                    fieldType = fieldType.Double[0].image;  // <--- double type
                } else {
                    console.log("Unknown floating point type");
                }
            }
        }
    } else if ("unannReferenceType" in fieldType) {  // <--- reference type (class/interface)
        fieldType = fieldType.unannReferenceType[0].children.unannClassOrInterfaceType[0].children.unannClassType[0].children.Identifier[0].image;
    } else {
        console.log("Unknown field type structure");
    }
    return fieldType;
}

function getProjectJSON(ast) {
    const output = {classes: []};
    var lastClass = null;
    var className = null;
    function walk(node) {
        if (!node || typeof node !== "object") return;

        if (node.name === "normalClassDeclaration" || node.name === "normalInterfaceDeclaration") {
            className = node.children.typeIdentifier[0].children.Identifier[0].image;
            if (className && className.length > 0) {
                output.classes.push({[className]: {methods: [], attributes: []}});
                lastClass = output.classes[output.classes.length - 1];
            }
        }else if (node.name === "methodDeclaration") {
            var methodName = node.children.methodHeader[0].children.methodDeclarator[0].children.Identifier[0].image;
            if (methodName && methodName.length > 0) {
                var methodReturnType = node.children.methodHeader[0].children.result[0].children; //getting return type of method
                if ("Void" in methodReturnType) {
                    methodReturnType = "void";
                } else {
                    methodReturnType = getTypeOfNode(methodReturnType.unannType[0].children);
                }

                var parameterList = [];   //getting parameters of method
                var paramListObj = node.children.methodHeader[0].children.methodDeclarator[0].children
                if ("formalParameterList" in paramListObj){
                    paramListObj = paramListObj.formalParameterList[0].children.formalParameter;
                    console.log(paramListObj);
                    paramListObj.forEach(element => {
                        var paramType = getTypeOfNode(element.children.variableParaRegularParameter[0].children.unannType[0].children);
                        var paramName = element.children.variableParaRegularParameter[0].children.variableDeclaratorId[0].children.Identifier[0].image;
                        parameterList.push({[paramName]: paramType});
                    });
                }

                lastClass[className].methods.push({[methodName]: {parameters: parameterList, returnType: methodReturnType}});
            }
        }else if (node.name === "fieldDeclaration") {
            var fieldName = node.children.variableDeclaratorList[0].children.variableDeclarator[0].children.variableDeclaratorId[0].children.Identifier[0].image;
            //console.log(node.children.unannType[0].children.unannPrimitiveTypeWithOptionalDimsSuffix[0].children.primitiveType);
            const fieldType = getTypeOfNode(node.children.unannType[0].children);            

            if (fieldName && fieldName.length > 0) {
                lastClass[className].attributes.push({[fieldName]: {type: fieldType}});
            }
        }

        if (node.children) {
            for (const key in node.children) {
                const childArr = node.children[key];
                if (Array.isArray(childArr)) {
                    childArr.forEach(walk);
                }
            }
        }
    }

    walk(ast);

    const json = JSON.stringify(output, null, 2);
    //console.log(json);
    return json;
}



function printAST(node, indent = 0) {
    if (!node || typeof node !== "object") return;

    const padding = " ".repeat(indent);

    // Print basic info about the node
    let info = node.name || node.token || "";
    if (node.image) info += ` → ${node.image}`;
    console.log(`${padding}${info}`);

    // Recursively walk children
    if (node.children) {
        for (const key in node.children) {
            const child = node.children[key];

            if (Array.isArray(child)) {
                child.forEach(c => printAST(c, indent + 2));
            } else {
                printAST(child, indent + 2);
            }
        }
    }
}



// Usage
const projectPath = "C:/Users/Legion/OneDrive/Desktop/skola/rocnik 5/ADIT/java-sample-mvc/src/Models";
const files = listJavaFiles(projectPath);

var finalOutput = {classes: []};

for (const file of files) {
    //console.log(`Processing file: ${file}`);
    const code = fs.readFileSync(file, "utf8");
    //console.log(`File content length: ${code.length} characters`);
    const ast = parse(code);
    //printAST(ast);
    const json = getProjectJSON(ast);
    
    // Merge json into finalOutput
    const parsedJson = JSON.parse(json);
    finalOutput.classes = finalOutput.classes.concat(parsedJson.classes);
}

finalOutput = JSON.stringify(finalOutput, null, 2);
console.log(finalOutput);
fs.writeFileSync("JSONs/output.json", finalOutput, "utf8");


