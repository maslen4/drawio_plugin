import fs from "fs";

function generateFlowFromJSON(json, methodName) {

    var returnType = null;

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


    function flowforMethod(methodName) { // recursive function to follow method calls

        json.classes.forEach(fromClass => {
            const classContent = Object.values(fromClass)[0]; // get { methods: [...], attributes: [...] }
            const className = Object.keys(fromClass)[0]; 
            
            classContent.methods.forEach(method => { //get each method of class
                if (method[methodName]) {
                    const methodContent = method[methodName];

                    if (methodContent) {

                        var objects = methodContent.objects;

                        Object.values(objects).forEach(object => { //get all called methods(of other classes) inside this method

                            object.calls.forEach(call => {
                                console.log("\nCALL From: " + className + " To: " + object.type + " Method: " + call);
                                flowforMethod(call);  // recursive call
                                var returnType = returnTypeOfMethod(call);
                                if (returnType && returnType !== "void") {
                                    console.log("RETURN From: " + object.type + " To: " + className + " Of type: " + returnType + "\n");
                                }
                            });

                        });
                        
                    }
                }
            });
        });
    }

    flowforMethod(methodName);
}



var methodName = "I"; //taken from User Input
var obj = null;

fs.readFile('plugins/JSONs/output.json', 'utf-8', function (err, data) {
    if (err) throw err;

    obj = JSON.parse(data);
    generateFlowFromJSON(obj, methodName);
});


