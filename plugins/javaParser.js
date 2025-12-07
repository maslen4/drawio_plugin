import { parse } from "java-parser";

// expected input node has to have a primitiveType or referenceType property
function getTypeOfNode(node) {
    var fieldType = node;
    var dims = "";
    if ("unannPrimitiveTypeWithOptionalDimsSuffix" in fieldType || "primitiveType" in fieldType) { // primitive type
        if ("primitiveType" in fieldType) {
            if ("dims" in fieldType) {
                dims = "[]";
            }
            fieldType = fieldType.primitiveType[0].children;
        } else {
            fieldType = fieldType.unannPrimitiveTypeWithOptionalDimsSuffix[0].children;
            if ("dims" in fieldType) {
                dims = "[]";
            }
            fieldType = fieldType.unannPrimitiveType[0].children;
        }
        if ("Boolean" in fieldType) {
            fieldType = fieldType.Boolean[0].image;
        } else if ("numericType" in fieldType) {
            fieldType = fieldType.numericType[0].children;
            if ("integralType" in fieldType) {
                fieldType = Object.keys(fieldType.integralType[0].children)[0].toLowerCase();
            } else if ("floatingPointType" in fieldType) {
                fieldType = Object.keys(fieldType.floatingPointType[0].children)[0].toLowerCase();
            } else {
                return "unknown";
            }
        } else {
            return "unknown";
        }
    } else if ("unannReferenceType" in fieldType || "referenceType" in fieldType) { // reference type
        let complexType;
        if ("referenceType" in fieldType) {
            if ("primitiveType" in fieldType.referenceType[0].children) {
                return getTypeOfNode(fieldType.referenceType[0].children);
            }
            fieldType = fieldType.referenceType[0].children;
            if ("dims" in fieldType) {
                dims = "[]";
            }
            complexType = fieldType.classOrInterfaceType[0].children.classType[0];
        } else {
            fieldType = fieldType.unannReferenceType[0].children;
            if ("dims" in fieldType) {
                dims = "[]";
            }
            complexType = fieldType.unannClassOrInterfaceType[0].children.unannClassType[0];
        }

        if ("typeArguments" in complexType.children) {
            const allArguments = complexType.children.typeArguments[0].children.typeArgumentList[0].children.typeArgument;
            let argsString = "<";
            allArguments.forEach((arg, index) => {
                const argType = getTypeOfNode(arg.children);
                argsString += argType;
                if (index < allArguments.length - 1) {
                    argsString += ", ";
                }
            });
            argsString += ">";
            fieldType = complexType.children.Identifier[0].image + argsString;
        } else {
            fieldType = complexType.children.Identifier[0].image;
        }
    } else {
        return "unknown";
    }
    return fieldType + dims;
}

// Convert AST to JSON representation of classes and interfaces
function getProjectJSON(ast) {
    const output = { classes: [], interfaces: [] };
    let inheritances = [];
    let lastClass = null;
    let className = null;

    function walk(node) {
        if (!node || typeof node !== "object") return;
        if (node.name === "normalInterfaceDeclaration") {
            const interfaceName = node.children.typeIdentifier[0].children.Identifier[0].image;
            if (interfaceName && interfaceName.length > 0) {
                output.interfaces.push({ [interfaceName]: { methods: [], attributes: [] } });
                lastClass = output.interfaces[output.interfaces.length - 1];
            }
            className = interfaceName;
        } else if (node.name === "normalClassDeclaration") {
            className = node.children.typeIdentifier[0].children.Identifier[0].image;
            if (className && className.length > 0) {
                output.classes.push({ [className]: { methods: [], attributes: [] } });
                lastClass = output.classes[output.classes.length - 1];
            }
        } else if (node.name === "methodDeclaration") {
            const methodName = node.children.methodHeader[0].children.methodDeclarator[0].children.Identifier[0].image;
            if (methodName && methodName.length > 0) {
                let methodReturnType = node.children.methodHeader[0].children.result[0].children;
                if ("Void" in methodReturnType) {
                    methodReturnType = "void";
                } else {
                    methodReturnType = getTypeOfNode(methodReturnType.unannType[0].children);
                }

                const parameterList = [];
                let paramListObj = node.children.methodHeader[0].children.methodDeclarator[0].children;
                if ("formalParameterList" in paramListObj) {
                    paramListObj = paramListObj.formalParameterList[0].children.formalParameter;
                    paramListObj.forEach(element => {
                        const paramType = getTypeOfNode(element.children.variableParaRegularParameter[0].children.unannType[0].children);
                        const paramName = element.children.variableParaRegularParameter[0].children.variableDeclaratorId[0].children.Identifier[0].image;
                        parameterList.push({ [paramName]: paramType });
                    });
                }

                lastClass[className].methods.push({ [methodName]: { parameters: parameterList, returnType: methodReturnType } });
            }
        } else if (node.name === "fieldDeclaration") {
            const fieldName = node.children.variableDeclaratorList[0].children.variableDeclarator[0].children.variableDeclaratorId[0].children.Identifier[0].image;
            const fieldType = getTypeOfNode(node.children.unannType[0].children);

            if (fieldName && fieldName.length > 0) {
                lastClass[className].attributes.push({ [fieldName]: { type: fieldType } });
            }
        } else if (node.name === "classImplements") {
            const interfaceName = node.children.interfaceTypeList[0].children.interfaceType[0].children.classType[0].children.Identifier[0].image;
            if (className && interfaceName) {
                inheritances.push({ from: className, to: interfaceName, type: "implements" });
            }
        } else if (node.name === "classExtends") {
            const interfaceName = node.children.classType[0].children.Identifier[0].image;
            if (className && interfaceName) {
                inheritances.push({ from: className, to: interfaceName, type: "extends" });
            }
        } else if (node.name === "interfaceExtends") {
            const interfaceName = node.children.interfaceTypeList[0].children.interfaceType[0].children.classType[0].children.Identifier[0].image;
            if (className && interfaceName) {
                inheritances.push({ from: className, to: interfaceName, type: "extends" });
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
    return [json, inheritances];
}

function printAST(node, indent = 0) {
    if (!node || typeof node !== "object") return;
    const padding = " ".repeat(indent);
    let info = node.name || node.token || "";
    if (node.image) info += ` + ${node.image}`;
    console.log(`${padding}${info}`);

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

function getAssociations(json) {
    const associations = [];
    const listOfClasses = [];

    json.classes.forEach(cls => {
        const className = Object.keys(cls)[0];
        listOfClasses.push(className);
    });
    json.interfaces.forEach(intf => {
        const interfaceName = Object.keys(intf)[0];
        listOfClasses.push(interfaceName);
    });

    json.classes.forEach(cls => {
        const attributes = cls[Object.keys(cls)[0]].attributes;
        attributes.forEach(attr => {
            let attrType = attr[Object.keys(attr)[0]].type;
            const parts = attrType.split(/[<>,]/).map(x => x.trim()).filter(x => x.length > 0);

            for (let part of parts) {
                if (part.endsWith("[]")) {
                    part = part.slice(0, -2);
                }
                if (listOfClasses.includes(part)) {
                    associations.push({ from: Object.keys(cls)[0], to: part });
                }
            }
        });
    });
    return associations;
}

function getInheritances(json, possibleInheritances) {
    const inheritances = [];
    const listOfClasses = [];

    json.classes.forEach(cls => {
        const className = Object.keys(cls)[0];
        listOfClasses.push(className);
    });
    json.interfaces.forEach(intf => {
        const interfaceName = Object.keys(intf)[0];
        listOfClasses.push(interfaceName);
    });

    possibleInheritances.forEach(inh => {
        if (listOfClasses.includes(inh.to)) {
            inheritances.push(inh);
        }
    });
    return inheritances;
}

// files: array of { name, text }
export function parseJavaProject(files) {
    if (!Array.isArray(files)) {
        return { project: { classes: [], interfaces: [] }, relations: { associations: [], inheritances: [] } };
    }

    const finalOutput = { classes: [], interfaces: [] };
    let possibleInheritances = [];

    for (const file of files) {
        if (!file || !file.name || !file.text || !file.name.toLowerCase().endsWith(".java")) {
            continue;
        }
        const ast = parse(file.text);
        // printAST(ast);
        const [json, inheritancesInFile] = getProjectJSON(ast);

        possibleInheritances = possibleInheritances.concat(inheritancesInFile);

        const parsedJson = JSON.parse(json);
        finalOutput.classes = finalOutput.classes.concat(parsedJson.classes);
        finalOutput.interfaces = finalOutput.interfaces.concat(parsedJson.interfaces);
    }

    const associations = getAssociations(finalOutput);
    const inheritances = getInheritances(finalOutput, possibleInheritances);
    const relations = { associations: associations, inheritances: inheritances };

    return { project: finalOutput, relations };
}
