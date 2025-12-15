

const flow = {
  "sequence": [
    {
      "type": "method",
      "name": "loginRequest",
      "from": "Client",
      "to": "AuthController",
      "return": "void"
    },
    {
      "type": "method",
      "name": "checkCredentials",
      "from": "AuthController",
      "to": "AuthService",
      "return": "boolean"
    },
    {
      "type": "fragment",
      "fragmentType": "alt",
      "condition": "credentialsValid",
      "children": [
        {
          "type": "method",
          "name": "createSession",
          "from": "AuthService",
          "to": "SessionManager",
          "return": "Session"
        },
        {
          "type": "fragment",
          "fragmentType": "loop",
          "condition": "rolesRemaining",
          "children": [
            {
              "type": "method",
              "name": "loadRole",
              "from": "SessionManager",
              "to": "RoleService",
              "return": "Role"
            }
          ]
        }
      ],
      "else": [
        {
          "type": "method",
          "name": "showError",
          "from": "AuthController",
          "to": "Client",
          "return": "ErrorMessage"
        }
      ]
    },
    {
      "type": "method",
      "name": "displayDashboard",
      "from": "Client",
      "to": "UI",
      "return": "void"
    }
  ]
}

 
/*
const flow = {
  "sequence": [
    {
      "type": "method",
      "name": "request",
      "from": "Client",
      "to": "Controller",
      "return": "Response"
    },
    {
      "type": "fragment",
      "fragmentType": "opt",
      "condition": "isAuthenticated",
      "children": [
        {
          "type": "method",
          "name": "loadProfile",
          "from": "Controller",
          "to": "ProfileService",
          "return": "Profile"
        },
        {
          "type": "fragment",
          "fragmentType": "opt",
          "condition": "hasPreferences",
          "children": [
            {
              "type": "method",
              "name": "loadPreferences",
              "from": "ProfileService",
              "to": "PreferenceService",
              "return": "Preferences"
            }
          ]
        }
      ]
    }
  ]
}
*/

/*
const flow = {
  "sequence": [
    {
      "type": "method",
      "name": "processItems",
      "from": "Client",
      "to": "Processor",
      "return": "Summary"
    },
    {
      "type": "fragment",
      "fragmentType": "loop",
      "condition": "itemsRemaining",
      "children": [
        {
          "type": "method",
          "name": "loadItem",
          "from": "Processor",
          "to": "Repository",
          "return": "Item"
        },
        {
          "type": "fragment",
          "fragmentType": "opt",
          "condition": "needsValidation",
          "children": [
            {
              "type": "method",
              "name": "validateItem",
              "from": "Repository",
              "to": "Validator",
              "return": "boolean"
            }
          ]
        }
      ]
    }
  ]
}
*/

/*
const flow = {
  "sequence": [
    {
      "type": "method",
      "name": "start",
      "from": "Client",
      "to": "ServiceA",
      "return": "void"
    },
    {
      "type": "fragment",
      "fragmentType": "opt",
      "condition": "featureEnabled",
      "children": [
        {
          "type": "fragment",
          "fragmentType": "loop",
          "condition": "elementsRemaining",
          "children": [
            {
              "type": "method",
              "name": "processElement",
              "from": "ServiceA",
              "to": "ServiceB",
              "return": "Result"
            },
            {
              "type": "fragment",
              "fragmentType": "opt",
              "condition": "needsExtraStep",
              "children": [
                {
                  "type": "method",
                  "name": "extraProcessing",
                  "from": "ServiceB",
                  "to": "ServiceC",
                  "return": "ExtraResult"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
*/


/*
const flow = {
  "sequence": [
    {
      "type": "method",
      "name": "execute",
      "from": "Client",
      "to": "Core",
      "return": "Result"
    },
    {
      "type": "fragment",
      "fragmentType": "loop",
      "condition": "roundsLeft",
      "children": [
        {
          "type": "fragment",
          "fragmentType": "opt",
          "condition": "conditionA",
          "children": [
            {
              "type": "fragment",
              "fragmentType": "loop",
              "condition": "stepsLeft",
              "children": [
                {
                  "type": "fragment",
                  "fragmentType": "opt",
                  "condition": "conditionB",
                  "children": [
                    {
                      "type": "method",
                      "name": "deepCall",
                      "from": "Core",
                      "to": "Subsystem",
                      "return": "DeepResult"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
*/

const flow2 = {
  "sequence": [
    {
      "type": "method",
      "name": "startRequest",
      "from": "Client",
      "to": "Gateway",
      "return": "void"
    },

    {
      "type": "fragment",
      "fragmentType": "opt",
      "condition": "requestValid",
      "children": [
        {
          "type": "method",
          "name": "authorize",
          "from": "Gateway",
          "to": "AuthService",
          "return": "AuthToken"
        },

        {
          "type": "fragment",
          "fragmentType": "loop",
          "condition": "servicesRemaining",
          "children": [
            {
              "type": "method",
              "name": "prepareCall",
              "from": "AuthService",
              "to": "ServiceRegistry",
              "return": "ServiceInfo"
            },

            {
              "type": "fragment",
              "fragmentType": "opt",
              "condition": "serviceAvailable",
              "children": [
                {
                  "type": "method",
                  "name": "invokeService",
                  "from": "ServiceRegistry",
                  "to": "RemoteService",
                  "return": "ServiceResult"
                },

                {
                  "type": "fragment",
                  "fragmentType": "loop",
                  "condition": "retriesLeft",
                  "children": [
                    {
                      "type": "method",
                      "name": "retryCall",
                      "from": "RemoteService",
                      "to": "Aggregator",
                      "return": "RetryResult"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },

    {
      "type": "method",
      "name": "aggregateResults",
      "from": "Gateway",
      "to": "Aggregator",
      "return": "AggregatedData"
    },

    {
      "type": "method",
      "name": "sendResponse",
      "from": "Aggregator",
      "to": "Client",
      "return": "Response"
    }
  ]
}




//Global variables

const Classes = [];

const LifelinePositions = {};

const MessagePositions = [];

const MessagesWithReturns = [];

const Fragments = [];

let ActivationBlocksWithPositions = [];







//Methods
const getSetOfClasses = (flow) => {
    const classes = new Set();
  
    flow.sequence.forEach(step => {
        if (step.type === 'method') {
            classes.add(step.from)
            classes.add(step.to)
          }else if (step.type === 'fragment') {
            if (step.children) {
              const childFlow = { sequence: step.children }
              const childClasses = getSetOfClasses(childFlow)
              childClasses.forEach(c => classes.add(c))
            }
        }
      }
    )
    return classes
}

const visualizeFlow = (flow, tabs) => {
  let tabLevel = tabs
  let spaces = ""
  for (let i=0; i<tabLevel; i++) {
    spaces += '    '
  }

  flow.sequence.forEach(step => {
        if (step.type === 'method') {
            console.log(spaces + `${step.name}(${step.return}) | ${step.from} -> ${step.to}`);
        }else if (step.type === 'fragment') {
            tabLevel++;
            console.log(spaces + `${step.fragmentType} fragment (condition: ${step.condition})`);
            const childFlow = { sequence: step.children }
            visualizeFlow(childFlow, tabLevel)
            if (step.else) {
                console.log(spaces + `--- Else branch ---`);
                const elseFlow = { sequence: step.else }
                visualizeFlow(elseFlow, tabLevel)
            }
            console.log(spaces + `End of ${step.fragmentType}`);
            tabLevel--;
        }
    }
  )
}

const computeLifelinePositions = (classes) => {
  const spacing = 150;
    let x = 100;
    const y = 20;

    classes.forEach(className => {
        LifelinePositions[className] = x;
        x += spacing;
    } );
}

const drawFlow = (flow) => {
    const canvas = document.getElementById('canvas')
  
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }
  
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    ctx.moveTo(0, 0);

    // Draw actors
    computeLifelinePositions( getSetOfClasses(flow) );
    drawClassActors(ctx, LifelinePositions);

    // Draw messages
    computeAllMesagsages(flow);
    computeMessageYPosition(150);
    //computeMessageYPosition(100, flow);
    //console.log('Message Positions:', messagePositions);
    drawMessages(ctx);

    

    // Compute activation blocks
    computeActivationBlocks(MessagePositions);
    drawActivationBlocks(ctx);
    console.log('Lifeline Positions:', LifelinePositions);
    console.log('Activation Blocks with Positions:', ActivationBlocksWithPositions);
    console.log('Messages with Returns:', MessagesWithReturns);
    computeFragmentPosition()
    drawFragments(ctx)

    const outputJSON = {
        lifelines: LifelinePositions,
        activationBlocks: ActivationBlocksWithPositions,
        messages: MessagePositions,
        fragments: Fragments,
    }

    console.log(JSON.stringify(outputJSON))
}


const getStartingLifelineName = (LifelinePositions) => {
    let name = Object.keys(LifelinePositions)[0];
    Object.keys(LifelinePositions).forEach(className => {
        if (LifelinePositions[className] < LifelinePositions[name]) {
            name = className;
        }
      }
  )
  return name
}

const drawMessage = (ctx, message, ret) => {
    const { start, end, name, y } = message;
    ctx.beginPath();
    ctx.moveTo(start, y);
    ctx.lineTo(end, y);
    ctx.stroke();
    ctx.fillText(name, (start + end) / 2 - (name.length * 3), y - 5);
    if (ret) {
        ctx.beginPath();
        ctx.moveTo(end, y);
        ctx.lineTo(end+10, y-7);
        ctx.stroke();
        ctx.moveTo(end, y);
        ctx.lineTo(end+10, y+7);
        ctx.stroke();
        
    }else{
        ctx.beginPath();
        ctx.moveTo(end, y);
        ctx.lineTo(end-10, y-7);
        ctx.stroke();
        ctx.moveTo(end, y);
        ctx.lineTo(end-10, y+7);
        ctx.stroke();
    }
}

const drawMessages = (ctx) => {
    MessagePositions.forEach(message => {
      if (message.start > message.end) {
        drawMessage(ctx, message, true);
      }else{
        drawMessage(ctx, message, false);
      }
    });
}


const drawActivationBlock = (ctx, x, yStart, yEnd) => {
    const width = 10;
    ctx.fillRect(x - width/2, yStart, width, yEnd - yStart);
}

const drawActivationBlocks = (ctx) => {
    Object.keys(ActivationBlocksWithPositions).forEach(className => {
        const x = LifelinePositions[className];
        const blocks = ActivationBlocksWithPositions[className];
        blocks.forEach(block => {
            if (block.endY !== null) {
                drawActivationBlock(ctx, x, block.startY, block.endY);
            }
        }
        );
    });
}

const computeMessageYPosition2 = (yPos, flow) => {
    let baseY = yPos
    
    const compute = (f) =>{
      f.sequence.forEach(step => {
        if (step.type === 'method') {
          const message = {
            from: LifelinePositions[step.from],
            to: LifelinePositions[step.to],
            name: step.name,
            y: baseY
          }
          MessagePositions.push(message);
          baseY += 50;
        }else if (step.type === 'fragment') {
          compute({sequence: step.children});
        }
      }
      )
    }
    compute(flow);
}

const drawFragment = (ctx, fragment) => {
    const { name, startX, endX, startY, endY} = fragment;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, startY);
    ctx.lineTo(endX, endY);
    ctx.lineTo(startX, endY);
    ctx.lineTo(startX, startY);
    ctx.stroke();
    ctx.fillText(name, startX, startY);
    
}

const drawFragments = (ctx) => {
    Fragments.forEach(fragment => {
        drawFragment(ctx, fragment)
    })
}

const computeFragmentPosition = () => {
    console.log("MessagePositions: ", MessagePositions)

    Fragments.forEach(fragment => {

        fragment.started = false
        fragment.complete = false

        MessagePositions.forEach(message => {

            if (message.index == fragment.index){

                if (message.type == 'method'){

                    fragment.started = true
                    fragment.startX = message.start - 20
                    fragment.startY = message.y - 20
                    fragment.endX = message.end + 20

                }else if(message.type == 'return'){

                    fragment.endY = message.y + 20
                    fragment.complete = true

                }

            }else if(fragment.started && !fragment.complete){

                if(fragment.endX < message.end){

                    fragment.endX = message.end + 20
                }
            }
        })
    })
    console.log("Fragments: ", Fragments)
}

const computeMessageYPosition = (yPos) => {
    let baseY = yPos

    
    MessagesWithReturns.forEach(step => {
        const message = {
            index: step.index,
            start: LifelinePositions[step.from],
            end: LifelinePositions[step.to],
            from: step.from,
            to: step.to,
            name: step.name,
            y: baseY,
            type: step.type
          }
          MessagePositions.push(message);
          baseY += 45;
    });
    //console.log("MessagePositions: ", messagePositions)
}


const computeActivationBlocks = (messages) => {
    const activations = {};
    const startingLifeline = getStartingLifelineName(LifelinePositions);

    Object.keys(LifelinePositions).forEach(className => {
        activations[className] = [];
    });

    


    //console.log(messages)
    messages.forEach(message => {
        const { from, to } = message;
        if (message.type === 'method') {
          //console.log(activations[to])
            activations[to].push({ startY: message.y, endY: null });
            
            if (message.from == startingLifeline){
                activations[startingLifeline].push({ startY: message.y - 50, endY: null });
            }
            //console.log(activations[to])
        }else if (message.type === 'return') {
            const lastActivation = activations[from][activations[from].length - 1];
            if (lastActivation && lastActivation.endY === null) {
                lastActivation.endY = message.y;
            }
            if (message.to == startingLifeline){
                activations[to][activations[to].length - 1].endY = message.y + 50;
            }
        }
    });

    ActivationBlocksWithPositions = activations;
}



const flattenFlow = (f) => {
    const flatMessages = []
    const alternativeMessages = []
    const fragmentStack = []
    let currentFragment = {
        name: null,
        startX: null,
        startY: null,
        endX: null,
        endY: null,
        index: null
    }
    let index = 0

    const flatten = (f, m) => {
        f.sequence.forEach(step => {
            if (step.type === 'method') {
                step.index = index++; 
                m.push(step)
                //currentFragment.messages.push(step)
                if (!currentFragment.index){
                    currentFragment.index = step.index
                }

            }else if (step.type === 'fragment') {
                
                

                fragmentStack.push(currentFragment)

                currentFragment = {
                    name: step.fragmentType,
                    index: null
                }

                flatten({sequence: step.children}, flatMessages);
                
                Fragments.push(currentFragment)
                if (fragmentStack.length > 0){
                    currentFragment = fragmentStack.pop()
                }else{
                    currentFragment = {
                        name: null
                    }
                }
                
            
            }
      }
    )
  }
  flatten(f, flatMessages);
  //console.log('Flat Messages:', flatMessages);
  //console.log('Alternative Messages:', alternativeMessages);
  //console.log('FragmentParts: ', fragmentParts)
  //console.log('Fragments: ', Fragments)
  return flatMessages
}


const computeAllMesagsages = (flow) => {
    const flatMessages = flattenFlow(flow);
    const returnMessages = []

    //console.log('Return Messages:', JSON.stringify(returnMessages));

    let index = 0
    let currentNode = flatMessages[index];
    let nextNode = null;


    while (index < flatMessages.length) {

            
            MessagesWithReturns.push(currentNode);
            if (currentNode.return) {

                

                const returnMessage = {
                    type: 'return',
                    from: currentNode.to,
                    to: currentNode.from,
                    name: `return ${currentNode.return}`,
                    index: currentNode.index
                }
                returnMessages.push(returnMessage);
                //console.log("Return message: ", returnMessage)
            }

            //console.log("Flat messages length: ", flatMessages.length)
            console.log("Index: ", index)

            if (index < flatMessages.length - 1) {
                nextNode = flatMessages[index + 1];
            }
            //console.log('Current Node:', currentNode);
            console.log("Current node ", currentNode)
            console.log("Next node ", nextNode)
            console.log("Next return message on stack: ", returnMessages[returnMessages.length-1])

            if ((index == flatMessages.length-1) || nextNode && !(currentNode.to == nextNode.from)){
                if (returnMessages.length>0){
                   currentNode = returnMessages.pop(); 
                }else{
                    break
                }
                
            }else if (nextNode){
                currentNode = nextNode;
                if (index < flatMessages.length - 1){
                  index++;  
                }
                console.log("Index after increasing: ", index)
            }else{
                break
            }   
            

        
        
            
        

        
    }
    //console.log('Whole Flow with Returns:', wholeFlow);
}


const drawRectangle = (ctx, x, y, width, height, text) => {
    ctx.strokeRect(x, y, width, height);
    ctx.fillText(text, x + 10, y + 25);
}


const drawLifeLine = (ctx, x, yStart, yEnd) => {
    ctx.beginPath();
    ctx.moveTo(x, yStart);
    ctx.lineTo(x, yEnd);
    ctx.stroke();
}


const drawActor = (ctx, x, y, name) => {
    const width = name.length * 10 + 10; // Adjust width based on name length
    drawRectangle(ctx, x - width/2, y, width,  50, name);
    drawLifeLine(ctx, x, y + 50, ctx.canvas.height - 20);
}


const drawClassActors = (ctx, LifelinePositions) => {
    Object.keys(LifelinePositions).forEach(className => {
        const x = LifelinePositions[className];
        drawActor(ctx, x, 20, className);
    });
}


function handleButtonClick() {
    drawFlow(flow);
}

// Attach to button click event
document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('button');
    if (button) {
        button.addEventListener('click', handleButtonClick);
    }
});