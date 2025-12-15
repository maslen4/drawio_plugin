import fs from "fs";

function generateFlowFromJSON(json, methodName) {

    var returnType = null;


    const output = {sequence: []};

    let fragmentStack = [];

    function getFragmentById(fragments, id) {
        return fragments.find(f => f.id === id);
    }

    function returnTypeOfMethod(methodName) {
        json.classes.forEach(fromClass => {
            const classContent = Object.values(fromClass)[0]; // get { methods: [...], attributes: [...] }
            
            classContent.methods.forEach(method => { //get each method of class
                if (method[methodName]) {
                    var methodContent = method[methodName];
                    returnType =  methodContent.returnType;
                }
            });
        });
        return returnType;
    }


    function flowforMethod(methodName, currentFragmentPassed) { // recursive function to follow method calls

        json.classes.forEach(fromClass => {
            const classContent = Object.values(fromClass)[0]; // get { methods: [...], attributes: [...] }
            const className = Object.keys(fromClass)[0]; 
            
            classContent.methods.forEach(method => { //get each method of class
                if (method[methodName]) {
                    const methodContent = method[methodName];

                    if (methodContent) {

                        var objects = methodContent.objects;
                        let allCalls = [];

                        Object.values(objects).forEach(object => {  //get all calls
                            object.calls.forEach(call => {
                                allCalls.push({
                                    from: className,
                                    to: object.type,
                                    calledMethod: call.calledMethod,
                                    offset: call.offset,
                                    fragment: call.currentFragment ? call.currentFragment : currentFragmentPassed
                                });
                            });
                        });

                        allCalls.sort((a, b) => a.offset - b.offset); //sort calls by offset so they are in correct order

                        allCalls.forEach(call => {

                            var isInFragment = false;

                            fragmentStack.forEach(fragment => {
                                if (fragment.id === call.fragment) {
                                    isInFragment = true;
                                }
                            });

                            if (call.fragment && 
                                (fragmentStack.length === 0 || fragmentStack[fragmentStack.length - 1].id !== call.fragment) && 
                                !isInFragment
                            ){
                                console.log(`--- ENTERING FRAGMENT ID: ${call.fragment} ---`);
                                let fragmentNode = {};
                                const fragmentMeta = getFragmentById(json.fragments, call.fragment);

                                if (fragmentMeta.else) {
                                    fragmentNode = {
                                        type: "fragment",
                                        id: fragmentMeta.id,
                                        fragmentType: fragmentMeta.type,
                                        condition: fragmentMeta.condition,
                                        children: [],
                                        else: []
                                    };
                                }
                                else{
                                    fragmentNode = {
                                        type: "fragment",
                                        id: fragmentMeta.id,
                                        fragmentType: fragmentMeta.type,
                                        condition: fragmentMeta.condition,
                                        children: []
                                    };
                                }

                                if (fragmentStack.length === 0) {
                                    // top-level fragment
                                    output.sequence.push(fragmentNode);
                                } else {
                                    // fragment inside another fragment's else

                                    const fragmentMeta = getFragmentById(json.fragments, fragmentStack[fragmentStack.length - 1].id);
                                    let elseStart = null;
                                    let elseEnd = null;
                                    if (fragmentMeta.else) {
                                        elseStart = fragmentMeta.else[0];
                                        elseEnd = fragmentMeta.else[1];
                                    }
                                    if (elseStart && call.offset >= elseStart && call.offset <= elseEnd) {
                                        fragmentStack[fragmentStack.length - 1].else.push(fragmentNode);
                                    }
                                    else{
                                        // nested fragment → goes into parent
                                        fragmentStack[fragmentStack.length - 1].children.push(fragmentNode);
                                    }
                                }

                                fragmentStack.push(fragmentNode);                     
                            }


                            while (
                                fragmentStack.length > 0 &&
                                call.fragment !== fragmentStack[fragmentStack.length - 1].id
                            ) {
                                console.log(`--- EXITING FRAGMENT ID: ${fragmentStack[fragmentStack.length -1].id} ---`);
                                fragmentStack.pop();
                            }

                            console.log(
                                `\nCALL From: ${call.from} To: ${call.to} Method: ${call.calledMethod}()` +
                                (call.fragment ? ` [Fragment ID: ${call.fragment}]` : "") +
                                "\n"
                            );

                            const methodNode = {
                                type: "method",
                                name: call.calledMethod,
                                arguments: [],
                                from: call.from,
                                to: call.to,
                                return: returnTypeOfMethod(call.calledMethod)
                            };

                            if (fragmentStack.length === 0) {
                                output.sequence.push(methodNode);
                            } else { 
                                const fragmentMeta = getFragmentById(json.fragments, call.fragment);
                                let elseStart = null;
                                let elseEnd = null;
                                if (fragmentMeta.else) {
                                    elseStart = fragmentMeta.else[0];
                                    elseEnd = fragmentMeta.else[1];
                                }
                                if (elseStart && call.offset >= elseStart && call.offset <= elseEnd) {
                                    fragmentStack[fragmentStack.length - 1].else.push(methodNode);
                                }
                                else{
                                fragmentStack[fragmentStack.length - 1].children.push(methodNode);
                                }
                            }


                            flowforMethod(call.calledMethod, call.fragment); // recursive call

                            const returnType = returnTypeOfMethod(call);
                            if (returnType && returnType !== "void") {
                                console.log(
                                    `RETURN From: ${call.to} To: ${call.from} Of type: ${returnType}\n`
                                );
                            }
                        });

                        
                    }
                }
            });
        });
    }

    flowforMethod(methodName, null);

    return output;
}



var methodName = "O"; //taken from User Input
var obj = null;
var finalOutput = {sequence: []};

fs.readFile('plugins/JSONs/output.json', 'utf-8', function (err, data) {
    if (err) throw err;

    obj = JSON.parse(data);
    const json = generateFlowFromJSON(obj, methodName);
    finalOutput.sequence.push(json.sequence);

    finalOutput = JSON.stringify(finalOutput, null, 2);
    //console.log(finalOutput);
    fs.writeFileSync("plugins/JSONs/output1.json", finalOutput, "utf8");
});




