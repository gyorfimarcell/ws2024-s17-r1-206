const memberTable = document.getElementById("member-table");
const stageTable = document.getElementById("stage-table");

fetch("https://ub2023-backend.onrender.com/api/v1/stages/")
    .then((response) => response.json()
        .then((data) => {
            createMemberRows();
            createStageRows(data);

            loadData();

            updateRunnerOptions();
            updateMemberTotalDistances();
            updateStageTimes();
        }));


//#region Creating the tables

/**
 * Fills the Team member table with a header and 10 rows.
 */
function createMemberRows() {
    const header = createHeader(["#", "First name", "Last name", "Speed", "Distance"]);
    memberTable.appendChild(header);

    const tableBody = document.createElement("div");
    tableBody.className = "table-body";

    for (let index = 0; index < 10; index++) {
        let lineNumber = document.createElement("p");
        lineNumber.innerText = index + 1;

        let firstNameInput = document.createElement("input");
        firstNameInput.type = "text";
        firstNameInput.placeholder = "First name";
        firstNameInput.className = "member-firstname";
        firstNameInput.onchange = onMemberNameChange;

        let lastNameInput = document.createElement("input");
        lastNameInput.type = "text";
        lastNameInput.placeholder = "Last name";
        lastNameInput.className = "member-lastname";
        lastNameInput.onchange = onMemberNameChange;

        let speedInput = document.createElement("input");
        speedInput.type = "text";
        speedInput.maxLength = 5;
        speedInput.placeholder = "00:00";
        speedInput.className = "member-speed";
        speedInput.addEventListener("change", onMemberSpeedChange);

        let distance = document.createElement("p");
        distance.className = "member-distance";

        const row = createRow([lineNumber, firstNameInput, lastNameInput, speedInput, distance]);
        tableBody.appendChild(row);
    }
    memberTable.appendChild(tableBody);
}

/**
 * Fills the Stage Assignment table with a header and a row for each stage.
 * @param {object} stageData The object returned from the API
 */
function createStageRows(stageData) {
    const header = createHeader(["#", "Distance", "Starting point", "Arriving point", "Name", "Runner", "Time"]);
    stageTable.appendChild(header);

    const tableBody = document.createElement("div");
    tableBody.className = "table-body";

    stageData.forEach(stage => {
        let lineNumber = document.createElement("p");
        lineNumber.innerText = stage.id;

        let distance = document.createElement("p");
        distance.innerText = stage.distance;
        distance.className = "stage-distance";

        let startingLocation = document.createElement("p");
        startingLocation.innerText = stage.startingLocation;

        let arrivingLocation = document.createElement("p");
        arrivingLocation.innerText = stage.arrivalLocation;

        let name = document.createElement("p");
        name.innerText = stage.name;

        let runnerSelect = document.createElement("select");
        runnerSelect.name = "stage-runner";
        runnerSelect.className = "stage-runner"
        runnerSelect.setAttribute("aria-label", "Runner");
        runnerSelect.addEventListener("change", onRunnerChange);

        let time = document.createElement("p");
        time.className = "stage-time";

        const row = createRow([lineNumber, distance, startingLocation, arrivingLocation, name, runnerSelect, time]);
        tableBody.appendChild(row);
    });
    stageTable.appendChild(tableBody);
}

/**
 * Helper function for creating a header row.
 * @param {string[]} titles A list containing the title of the columns
 * @returns A row, containing the header cells
 */
function createHeader(titles) {
    let row = document.createElement("header");
    row.className = "table-header";

    titles.forEach(title => {
        let cell = document.createElement("div");
        cell.className = "col";

        let titleElement = document.createElement("p");
        titleElement.innerText = title;

        cell.appendChild(titleElement);
        row.appendChild(cell);
    });

    return row;
}

/**
 * Helper function for creating a row.
 * @param {HTMLElement[]} elements A list of elements to be put into the cells
 * @returns A row, containing the cells.
 */
function createRow(elements) {
    let row = document.createElement("div");
    row.className = "row";

    elements.forEach(element => {
        let cell = document.createElement("div");
        cell.className = "col";
        cell.appendChild(element);
        row.appendChild(cell);
    });

    return row;
}
//#endregion

//#region Updating the tables

/**
 * An object returned by the "getTeamMembers" function
 * @typedef {object} TeamMember
 * @property {number} index The index of the row
 * @property {string} firstName The first name of the member
 * @property {string} lastName The last name of the member
 * @property {string} speed The time needed to run 1 Km, in MM:SS format
 */

/**
 * Parses data from the Team members table, and returns a list of objects containing their fields.
 * @returns {TeamMember[]}
 */
function getTeamMembers() {
    const rows = memberTable.querySelectorAll(".row");
    let members = [];

    rows.forEach((row, index) => {
        members.push({
            index: index,
            firstName: row.querySelector(".member-firstname").value,
            lastName: row.querySelector(".member-lastname").value,
            speed: row.querySelector(".member-speed").value,
        });
    });

    return members;
}

/**
 * Updates the runners available to select in the Stage assignment table.
 */
function updateRunnerOptions() {
    /* First, the list of members is filtered, so only those with both a first and last name set are shown.
       Then, they are sorted alphabetically based on their names. */
    const members = getTeamMembers()
        .filter((member) => { return member.firstName && member.lastName })
        .sort(compareMemberName);

    const selects = stageTable.querySelectorAll("select");
    selects.forEach(select => {
        const previousValue = select.value;
        //Remove all previous options.
        select.innerHTML = "";

        let noRunnerOption = document.createElement("option");
        noRunnerOption.text = "No runner selected";
        noRunnerOption.value = -1;
        select.appendChild(noRunnerOption);

        members.forEach(member => {
            let option = document.createElement("option");
            option.value = member.index;
            option.text = `${member.firstName} ${member.lastName}`;

            //This is needed so the selected value doesn't reset every time this function is called.
            if (option.value == previousValue) {
                option.selected = true;
            }

            select.appendChild(option);
        });
    });
}

/**
 * Used in the "updateRunnerOptions" function to sort the team members.
 * @param {TeamMember} a
 * @param {TeamMember} b 
 */
function compareMemberName(a, b) {
    const aName = `${a.firstName} ${a.lastName}`;
    const bName = `${b.firstName} ${b.lastName}`;
    if (aName < bName) {
        return -1;
    }
    if (aName > bName) {
        return 1;
    }
    return 0;
}

/**
 * Calculates the total distance ran by each person, then updates the Team members table.
 */
function updateMemberTotalDistances() {
    let distances = Array(10).fill(0);

    const stageRows = stageTable.querySelectorAll(".row");
    stageRows.forEach(row => {
        const selectedMemberIndex = parseInt(row.querySelector(".stage-runner").value);
        if (selectedMemberIndex != -1) {
            distances[selectedMemberIndex] += parseFloat(row.querySelector(".stage-distance").innerText);
        }
    });

    const memberDistanceCells = memberTable.querySelectorAll(".member-distance");
    memberDistanceCells.forEach((cell, index) => {
        cell.innerText = distances[index].toFixed(1);
    });
}

/**
 * Updates each stage with the time it would take for the selected runner.
 */
function updateStageTimes() {
    const members = getTeamMembers();

    const stageRows = stageTable.querySelectorAll(".row");
    stageRows.forEach(row => {
        const selectedMemberIndex = parseInt(row.querySelector(".stage-runner").value);
        const distance = parseFloat(row.querySelector(".stage-distance").innerText);
        const timeElement = row.querySelector(".stage-time");

        if (selectedMemberIndex != -1) {
            const speed = members[selectedMemberIndex].speed; // This is in MM:SS format
            //The speed string is converted into seconds, and multiplied by the distance
            const seconds = distance * (parseInt(speed.slice(0, 2)) * 60 + parseInt(speed.slice(3, 5)));

            if (isNaN(seconds)) {
                timeElement.innerText = "-";
                return;
            }

            //The time is converted back into MM:SS format
            const minutesString = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secondsString = Math.floor(seconds % 60).toString().padStart(2, '0');
            timeElement.innerText = `${minutesString}:${secondsString}`;

        }
        else {
            timeElement.innerText = "-";
        }
    });
}
//#endregion

//#region Saving and loading

/**
 * Saves all team members and stage assignments to localstorage.
 */
function saveData() {
    const members = getTeamMembers();

    let assignments = {};
    const selects = stageTable.querySelectorAll(".stage-runner");
    selects.forEach((select, index) => {
        assignments[index] = select.value;
    });

    window.localStorage.setItem("members", JSON.stringify(members));
    window.localStorage.setItem("assignments", JSON.stringify(assignments));
}

/**
 * Loads team members and stage assignments from localstorage.
 */
function loadData() {
    const members = JSON.parse(window.localStorage.getItem("members"));
    const assignments = JSON.parse(window.localStorage.getItem("assignments"));
    if (!members || !assignments) {
        return;
    }

    const memberRows = memberTable.querySelectorAll(".row");
    memberRows.forEach((row, index) => {
        row.querySelector(".member-firstname").value = members[index].firstName;
        row.querySelector(".member-lastname").value = members[index].lastName;
        row.querySelector(".member-speed").value = members[index].speed;
    });

    updateRunnerOptions();

    const selects = stageTable.querySelectorAll(".stage-runner");
    selects.forEach((select, index) => {
        select.querySelector(`option[value="${assignments[index]}"]`).selected = true;
    });
}
//#endregion

//#region Event handlers

/**
 * Called when the firstname or lastname fields change.
 */
function onMemberNameChange() {
    saveData();
    updateRunnerOptions();

    //Because the row might have just become empty, these should be recalculated.
    updateMemberTotalDistances();
    updateStageTimes();
}

/**
 * Called when the speed fields change.
 */
function onMemberSpeedChange(event) {
    const field = event.target;
    let inputTime = field.value;
    //Input masking
    if (inputTime) {
        inputTime = inputTime.replaceAll(/[^\d:]/g, "0");

        if (inputTime.includes(":")) {
            const segments = inputTime.split(":");
            const minutes = segments[0].slice(0, 2).padStart(2, "0");
            const seconds = segments[1].slice(0, 2).padStart(2, "0");
            field.value = `${minutes}:${seconds}`;
        }
        else {
            let minutes = "00";
            let seconds = "00";
            if (inputTime.length < 3) {
                seconds = inputTime.slice(0, 2).padStart(2, "0");
            }
            else {
                minutes = inputTime.slice(0, 2).padStart(2, "0");
                seconds = inputTime.slice(2, 4).padStart(2, "0");
            }
            field.value = `${minutes}:${seconds}`;
        }
    }

    saveData();
    updateStageTimes();
}

/**
 * Called when the runner selection field changes.
 */
function onRunnerChange() {
    saveData();
    updateMemberTotalDistances();
    updateStageTimes();
}
//#endregion