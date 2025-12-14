import fs from "fs";
import path from "path";
import { parse } from "java-parser";
import util from "util";

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
    var fieldType = node;
    var dims = "";
    if ("unannPrimitiveTypeWithOptionalDimsSuffix" in fieldType) { // It is a primitive type
        fieldType = fieldType.unannPrimitiveTypeWithOptionalDimsSuffix[0].children;
        if ("dims" in fieldType) {
            dims = "[]";
        }
        fieldType = fieldType.unannPrimitiveType[0].children;
        if ("Boolean" in fieldType) {
            fieldType = fieldType.Boolean[0].image;  // <--- boolean type
        } else if ("numericType" in fieldType) {
            fieldType = fieldType.numericType[0].children;
            if ("integralType" in fieldType) {
                fieldType = Object.keys(fieldType.integralType[0].children)[0].toLowerCase();
            } else if ("floatingPointType" in fieldType) {
                fieldType = Object.keys(fieldType.floatingPointType[0].children)[0].toLowerCase();
            } else {
                console.log("Unknown numeric type structure");
                return "unknown";
            }
        } else {
            console.log("Unknown primitive type structure");
            return "unknown";
        }
    } else if ("unannReferenceType" in fieldType) {  // <--- reference type (class/interface)
        fieldType = fieldType.unannReferenceType[0].children;
        if ("dims" in fieldType) {
            dims = "[]";
        }
        fieldType = fieldType.unannClassOrInterfaceType[0].children.unannClassType[0].children.Identifier[0].image;
    } else {
        console.log("Unknown field type structure");
        return "Unknown type";
    }
    return fieldType + dims;
}

function getProjectJSON(ast, code) {
    const output = {classes: [], fragments: []};
    var lastClass = null;
    var className = null;
    var ifStart = null;
    var ifEnd = null;
    var ifConditionStart = null;
    var ifConditionEnd = null;
    var currentMethod = null;
    let currentObjects = {};  // variableName -> { type, calls[] }
    let currentClassInstance = null; 
    let currentVarName = null;

    let fragmentStack = [];
    let fragments = [];
    let methods = [];

    function walk(node) {
        if (!node || typeof node !== "object") return;


    
        if (node.name) {
        fs.appendFileSync(
            "D:/studium/agile/drawio_plugin/output.txt",
            node.name + "\n"
            );
        }


        if (node.name === "ifStatement") {

            ifConditionStart = node.children.LBrace[0].startOffset + 1;
            ifConditionEnd = node.children.RBrace[0].endOffset - 1;
            ifStart = node.location.startOffset;
            ifEnd = node.location.endOffset;

            const condition = code.substring(ifConditionStart, ifConditionEnd + 1);

            const fragment = {
                id: crypto.randomUUID(),
                type: node.children.Else ? "alt" : "opt",
                condition: condition,
                startOffset: node.location.startOffset,
                endOffset: node.location.endOffset,
                parent: fragmentStack.length
                    ? fragmentStack[fragmentStack.length - 1].id
                    : null,
                messages: []
            };

            fragments.push(fragment);
            output.fragments.push(fragment);
            fragmentStack.push(fragment);
        }

        if (node.name === "forStatement" || node.name === "whileStatement") {
            let loopConditionStart = 0;
            let loopConditionEnd = 0;

            if (node.children.enhancedForStatement){
                loopConditionStart = node.children.enhancedForStatement[0].children.LBrace[0].endOffset + 1;
                loopConditionEnd = node.children.enhancedForStatement[0].children.RBrace[0].startOffset - 1;
            }
            else if (node.children.basicForStatement){
                loopConditionStart = node.children.basicForStatement[0].children.LBrace[0].endOffset + 1;
                loopConditionEnd = node.children.basicForStatement[0].children.RBrace[0].startOffset - 1;
            }
            else{
                loopConditionStart = node.children.LBrace[0].endOffset + 1;
                loopConditionEnd = node.children.RBrace[0].startOffset - 1;
            }
            let loopStart = node.location.startOffset;
            let loopEnd = node.location.endOffset;

            const condition = code.substring(loopConditionStart, loopConditionEnd + 1);

            const fragment = {
                id: crypto.randomUUID(),
                type: "loop",
                condition: condition,
                startOffset: loopStart,
                endOffset: loopEnd,
                parent: fragmentStack.length
                    ? fragmentStack[fragmentStack.length - 1].id
                    : null,
                messages: []
            };

            fragments.push(fragment);
            output.fragments.push(fragment);
            fragmentStack.push(fragment);
        }

        if (node.name === "normalClassDeclaration" || node.name === "normalInterfaceDeclaration") {
            className = node.children.typeIdentifier[0].children.Identifier[0].image;
            if (className && className.length > 0) {
                output.classes.push({[className]: {methods: [], attributes: []}});
                lastClass = output.classes[output.classes.length - 1];
            }
        }else if (node.name === "methodDeclaration") {
            var methodName = node.children.methodHeader[0].children.methodDeclarator[0].children.Identifier[0].image;
            currentMethod = methodName;
            methods.push(methodName);

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
                    paramListObj.forEach(element => {
                        var paramType = getTypeOfNode(element.children.variableParaRegularParameter[0].children.unannType[0].children);
                        var paramName = element.children.variableParaRegularParameter[0].children.variableDeclaratorId[0].children.Identifier[0].image;
                        parameterList.push({[paramName]: paramType});
                    });
                }
                
            // --- CREATE METHOD OBJECT ---
            const methodObj = {
                parameters: parameterList,
                returnType: methodReturnType,
                objects: {own: {type: className, calls: []}} // initialize with "self" object
            };

            // PUSH METHOD
            lastClass[className].methods.push({
                [methodName]: methodObj
            });

            // STORE REFERENCE
            currentObjects = methodObj.objects;
            currentClassInstance = null;            }
        }else if (node.name === "fieldDeclaration") {
            var fieldName = node.children.variableDeclaratorList[0].children.variableDeclarator[0].children.variableDeclaratorId[0].children.Identifier[0].image;
            const fieldType = getTypeOfNode(node.children.unannType[0].children);            

            if (fieldName && fieldName.length > 0) {
                lastClass[className].attributes.push({[fieldName]: {type: fieldType}});
            }
        }else if (node.name === "unannClassOrInterfaceType"){
            currentClassInstance = node.children.unannClassType[0].children.Identifier[0].image;
        }
        else if (node.name === "variableDeclaratorId"){
            var foundVarName = node.children.Identifier[0].image;
            // register object in method
            currentObjects[foundVarName] = {
                type: currentClassInstance ?? "UNKNOWN",
                calls: []
            };
            currentClassInstance = null; // reset   
        }else if (node.name === "fqnOrRefTypePartFirst"){
            currentVarName = node.children.fqnOrRefTypePartCommon[0].children.Identifier[0].image;

            for (let i = 0; i < fragmentStack.length; i++) { // check if we are inside any fragments
                while ( 
                    fragmentStack.length > 0 &&
                    node.location?.endOffset >= fragmentStack[fragmentStack.length - 1].endOffset
                ) {
                    fragmentStack.pop(); // remove last fragment
                }
            }

            if(methods.includes(currentVarName)){
                // It is a method call on self
                if (currentObjects["own"]) {
                    currentObjects["own"].calls.push({calledMethod: currentVarName, currentFragment: fragmentStack.length ? fragmentStack[fragmentStack.length - 1].id : null, offset: node.children.fqnOrRefTypePartCommon[0].children.Identifier[0].startOffset});
                }
            }
        }
        else if (node.name === "fqnOrRefTypePartRest"){
            var calledMethod = node.children.fqnOrRefTypePartCommon[0].children.Identifier[0].image;

            for (let i = 0; i < fragmentStack.length; i++) { // check if we are inside any fragments
                while ( 
                    fragmentStack.length > 0 &&
                    node.location?.endOffset >= fragmentStack[fragmentStack.length - 1].endOffset
                ) {
                    fragmentStack.pop(); // remove last fragment
                }
            }


            if (currentObjects[currentVarName]) {
                currentObjects[currentVarName].calls.push({calledMethod: calledMethod, currentFragment: fragmentStack.length ? fragmentStack[fragmentStack.length - 1].id : null, offset: node.children.fqnOrRefTypePartCommon[0].children.Identifier[0].startOffset});
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
    return json;
}


// Usage
const projectPath = "D:\\studium\\agile\\java-sample-mvc\\src\\Outlier";
const files = listJavaFiles(projectPath);

var finalOutput = {classes: [], fragments: []};

for (const file of files) {
    const code = fs.readFileSync(file, "utf8");
    const ast = parse(code);
    //printAST(ast);
    const json = getProjectJSON(ast, code);
    
    // Merge json into finalOutput
    const parsedJson = JSON.parse(json);
    finalOutput.classes.push(...parsedJson.classes);
    finalOutput.fragments.push(...parsedJson.fragments);
}

finalOutput = JSON.stringify(finalOutput, null, 2);
//console.log(finalOutput);
fs.writeFileSync("plugins/JSONs/output.json", finalOutput, "utf8");

