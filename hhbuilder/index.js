// your code goes here ...

// Get handles to DOM elements -------------------------------------------------
var form = document.getElementsByTagName('form')[0];
var list = document.getElementsByClassName('household')[0];
var addButton = document.getElementsByClassName('add')[0];
var debug = document.getElementsByClassName('debug')[0];
var previousWarning;


// Define initial state --------------------------------------------------------
var householdMembers = [];
var uniqueKeyCounter = 0;


// Constants -------------------------------------------------------------------
var constants = {
  AGE_TITLE: 'Age: ',
  REL_TITLE: 'Relationship: ',
  SMOKER_TITLE: 'Smoker: ',
  RELATIONSHIP_MAP: {
    self: 'Self',
    spouse: 'Spouse',
    child: 'Child',
    parent: 'Parent',
    grandparent: 'Grandparent',
    other: 'Other',
  },
  WARNING_PREFACE: 'Sorry! We were unable to create a new household member:',
  AGE_WARNING: 'Age is required. Please enter a number greater than 0.',
  REL_WARNING: 'Relationship is required. Please select a relationship.',
  REMOVE_BUTTON: 'Remove',
};


// Helper functions ------------------------------------------------------------

function removeHouseholdMember(key) {
  // Remove member from DOM
  var memberToBeRemoved = document.getElementById('householdmember-' + key);
  list.removeChild(memberToBeRemoved);
  // Remove member from state
  householdMembers = householdMembers.filter(function(member) {
    return member.key !== key;
  });
}

function createMemberElement(member) {
  // Build household member properties
  var ageProperty = document.createElement('p');
  ageProperty.innerText = constants.AGE_TITLE + member.age;
  var relProperty = document.createElement('p');
  relProperty.innerText =
      constants.REL_TITLE + constants.RELATIONSHIP_MAP[member.rel];
  var smokerProperty = document.createElement('p');
  smokerProperty.innerText =
      constants.SMOKER_TITLE + (member.smoker ? 'Yes' : 'No');
  // Build the button to allow the user to remove this member
  var removeButton = document.createElement('button');
  removeButton.innerText = constants.REMOVE_BUTTON;
  removeButton.onclick = function() {
    removeHouseholdMember(member.key);
  }
  // Assemble list item
  var newMember = document.createElement('li');
  newMember.id = 'householdmember-' + member.key;
  newMember.appendChild(ageProperty);
  newMember.appendChild(relProperty);
  newMember.appendChild(smokerProperty);
  newMember.appendChild(removeButton);
  return newMember;
}

function createWarningItem(message) {
  var warning = document.createElement('li');
  var warningBody = document.createElement('p');
  warningBody.innerText = message;
  warning.appendChild(warningBody);
  return warning;
}

function createWarningList(items) {
  var warningDiv = document.createElement('div');
  // Define a helpful preface for the error
  var warningPreface = document.createElement('p');
  warningPreface.innerText = constants.WARNING_PREFACE;
  // Assemble the specific errors
  var warningList = document.createElement('ul');
  for (var i = 0; i < items.length; i++) {
    warningList.appendChild(items[i]);
  }
  warningDiv.appendChild(warningPreface);
  warningDiv.appendChild(warningList);
  return warningDiv;
}

function validateOrCreateWarningElement(member) {
  var warnings = [];
  // Validate or create warning list items
  if (!(parseInt(member.age) > 0)) {
    warnings.push(createWarningItem(constants.AGE_WARNING));
  }
  if (!member.rel) {
    warnings.push(createWarningItem(constants.REL_WARNING));
  }
  // Create warning list if field(s) were invalid
  if (warnings.length) {
    return createWarningList(warnings);
  }
  return false;
}


// Root functions --------------------------------------------------------------

function addHouseholdMember(event) {
  // Prevent a page reload
  event.preventDefault();
  // Define the new household member
  var member = {
    key: uniqueKeyCounter,
    age: parseInt(form.age.value),
    rel: form.rel.value,
    smoker: form.smoker.checked,
  };
  // Increment the uniqueKeyCounter to be ready for the next member
  uniqueKeyCounter += 1;
  // Validate or create a warning to alert the user of an invalid field
  var warning = validateOrCreateWarningElement(member);
  if (warning) {
    // Add the warning to the page or update it
    if (previousWarning) {
      form.replaceChild(warning, previousWarning);
    } else {
      form.appendChild(warning);
    }
    previousWarning = warning;
  } else {
    // Add the member to the state
    householdMembers.push(member);
    // Add the member to the DOM
    list.appendChild(createMemberElement(member));
    // Ready the form for the next entry
    form.reset();
    // If there was previously a warning, it can be dismissed
    if (previousWarning) {
      form.removeChild(previousWarning);
      previousWarning = null;
    }
  }
}

function submitForm(event) {
  event.preventDefault();
  var data = JSON.stringify({
    members: householdMembers,
  });
  // Display data in debug block
  debug.innerText = data;
  debug.style.display = 'block';
  // Send data to server as JSON
  var request = new XMLHttpRequest();
  request.open('POST', 'https://localhost/api/household/save');
  request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  request.send(data);
}

// Configure elements ----------------------------------------------------------
addButton.onclick = addHouseholdMember;
form.onsubmit = submitForm;
