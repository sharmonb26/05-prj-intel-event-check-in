console.log("script.js loaded");

// Get all needed DOM elements
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const attendeeCount = document.getElementById("attendeeCount");
const waterCount = document.getElementById("waterCount");
const zeroCount = document.getElementById("zeroCount");
const powerCount = document.getElementById("powerCount");
const greeting = document.getElementById("greeting");
const progressBar = document.getElementById("progressBar");
const attendeeList = document
  .getElementById("attendeeList")
  .getElementsByTagName("tbody")[0];
const confettiContainer = document.getElementById("confetti");

/ Check all needed DOM elements exist
if (
  !form ||
  !nameInput ||
  !teamSelect ||
  !attendeeCount ||
  !waterCount ||
  !zeroCount ||
  !powerCount ||
  !greeting ||
  !progressBar ||
  !document.getElementById("attendeeList") ||
  !document.getElementById("confetti")
) {
  console.log("One or more required elements are missing from the HTML.");
  // Stop script if elements are missing
  throw new Error("Missing DOM elements. Check your HTML IDs.");
}

// Track attendance
let count = 0;
const maxCount = 50;

// Track team attendance
const teamCounts = {
  water: 0,
  zero: 0,
  power: 0,
};

// Load counts from localStorage
if (localStorage.getItem("attendanceCount")) {
  count = parseInt(localStorage.getItem("attendanceCount"), 10);
  attendeeCount.textContent = count;
}
if (localStorage.getItem("teamCounts")) {
  const savedTeamCounts = JSON.parse(localStorage.getItem("teamCounts"));
  teamCounts.water = savedTeamCounts.water || 0;
  teamCounts.zero = savedTeamCounts.zero || 0;
  teamCounts.power = savedTeamCounts.power || 0;
  waterCount.textContent = teamCounts.water;
  zeroCount.textContent = teamCounts.zero;
  powerCount.textContent = teamCounts.power;
}
// Update progress bar on reload
const percent = Math.round((count / maxCount) * 100);
progressBar.style.width = `${percent}%`;

// Load attendee list from localStorage
let attendees = [];
if (localStorage.getItem("attendees")) {
  attendees = JSON.parse(localStorage.getItem("attendees"));
  updateAttendeeList();
}

// Check goal status
let goalReached = false;

// Restore goal status and message from localStorage
if (localStorage.getItem("goalReached") === "true") {
  goalReached = true;
}
if (localStorage.getItem("goalMessage")) {
  greeting.textContent = localStorage.getItem("goalMessage");
  greeting.classList.add("success-message");
  greeting.style.display = "block";
}

// Update attendee list display
function updateAttendeeList() {
  attendeeList.innerHTML = "";
  for (let i = 0; i < attendees.length; i++) {
    const attendee = attendees[i];
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = attendee.name;

    const teamCell = document.createElement("td");
    teamCell.textContent = attendee.teamName;

    const removeCell = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✗";
    removeBtn.className = "remove-attendee-btn";
    removeBtn.title = "Remove attendee";
    removeBtn.onclick = function () {
      removeAttendee(i);
    };
    removeCell.appendChild(removeBtn);

    row.appendChild(nameCell);
    row.appendChild(teamCell);
    row.appendChild(removeCell);
    attendeeList.appendChild(row);
  }
}

function removeAttendee(index) {
  // Get attendee info before removing
  const attendee = attendees[index];
  // Remove from attendees array
  attendees.splice(index, 1);

  // Decrease total count and team count
  if (count > 0) {
    count--;
  }
  if (teamCounts[attendee.team] > 0) {
    teamCounts[attendee.team]--;
  }

  // Update display
  attendeeCount.textContent = count;
  document.getElementById(`${attendee.team}Count`).textContent =
    teamCounts[attendee.team];

  // Save changes to localStorage
  localStorage.setItem("attendanceCount", count);
  localStorage.setItem("teamCounts", JSON.stringify(teamCounts));
  localStorage.setItem("attendees", JSON.stringify(attendees));

  // Update progress bar
  const percent = Math.round((count / maxCount) * 100);
  progressBar.style.width = `${percent}%`;

  // Update attendee list and team flash
  updateAttendeeList();
  updateLeadingTeamFlash();
}

// Find leading team
function updateLeadingTeamFlash() {
  // Find the highest team count
  let maxTeamCount = Math.max(
    teamCounts.water,
    teamCounts.zero,
    teamCounts.power
  );

  // Find all teams with the highest count
  let leaders = [];
  if (teamCounts.water === maxTeamCount) {
    leaders.push("water");
  }
  if (teamCounts.zero === maxTeamCount) {
    leaders.push("zero");
  }
  if (teamCounts.power === maxTeamCount) {
    leaders.push("power");
  }

  // Remove flash from all team cards
  document.querySelectorAll(".team-card").forEach(function (card) {
    card.classList.remove("flash");
    card.classList.remove("winner");
  });

  // Add flash to all leading team cards (if attendance goal not reached)
  if (count < maxCount) {
    for (let i = 0; i < leaders.length; i++) {
      document.querySelector(`.team-card.${leaders[i]}`).classList.add("flash");
    }
  }
}

// Call flash update on page load
updateLeadingTeamFlash();

// Handle form submission
form.addEventListener("submit", function (event) {
  event.preventDefault();

  // Get form values
  const name = nameInput.value.trim();
  const team = teamSelect.value;
  const teamName = teamSelect.options[teamSelect.selectedIndex].text;

  // Check for empty name or team
  if (name === "" || team === "") {
    greeting.textContent = "Please enter your name and select a team.";
    greeting.style.display = "block";
    return;
  }

  // Prevent over max count
  if (count >= maxCount) {
    greeting.textContent = "Maximum attendance reached!";
    greeting.style.display = "block";
    return;
  }

  // Increase total count
  count++;
  attendeeCount.textContent = count;

  // Increase team count and update display
  teamCounts[team]++;
  document.getElementById(`${team}Count`).textContent = teamCounts[team];

  // Save counts to localStorage
  localStorage.setItem("attendanceCount", count);
  localStorage.setItem("teamCounts", JSON.stringify(teamCounts));

  // Save attendee info
  attendees.push({ name: name, team: team, teamName: teamName });
  localStorage.setItem("attendees", JSON.stringify(attendees));
  updateAttendeeList();

  // Update progress bar
  const percent = Math.round((count / maxCount) * 100);
  progressBar.style.width = `${percent}%`;

  // Show greeting
  greeting.textContent = `Welcome, ${name}! You checked in for ${teamName}.`;
  greeting.style.display = "block";

  // Update leading team flash
  updateLeadingTeamFlash();

  // Check for attendance goal
  if (count === maxCount) {
    showWinnerMessage();
  }

  // Clear form
  form.reset();
  teamSelect.selectedIndex = 0;

  // Log for debugging
  console.log(`${name} checked in for team: ${teamName} (${team})`);
  console.log(`Total check-ins: ${count}`);
  console.log(`Check-ins for ${teamName}: ${teamCounts[team]}`);

  const message = `Welcome! ${name} from ${teamName}`;
  console.log(message);

  form.reset();
});

// Remove winner message from localStorage
localStorage.removeItem("goalMessage");

function showConfetti() {
  // Remove old confetti
  confettiContainer.innerHTML = "";
  // Create 40 confetti pieces
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti-piece";
    // Random color
    const colors = [
      "#00c7fd",
      "#00aeef",
      "#ecfdf3",
      "#e8f7fc",
      "#fffbe6",
      "#0071c5",
      "#003c71",
      "#ffeaea",
    ];
    confetti.style.background =
      colors[Math.floor(Math.random() * colors.length)];
    // Random position and delay
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.top = `-${Math.random() * 20}px`;
    confetti.style.animationDelay = `${Math.random()}s`;
    confettiContainer.appendChild(confetti);
  }
  // Remove confetti after animation
  setTimeout(function () {
    confettiContainer.innerHTML = "";
  }, 2200);
}

function showWinnerMessage() {
  goalReached = true;

  // Find the highest team count
  let maxTeamCount = Math.max(
    teamCounts.water,
    teamCounts.zero,
    teamCounts.power
  );

  // Find all teams with the highest count
  let winners = [];
  if (teamCounts.water === maxTeamCount) {
    winners.push("water");
  }
  if (teamCounts.zero === maxTeamCount) {
    winners.push("zero");
  }
  if (teamCounts.power === maxTeamCount) {
    winners.push("power");
  }

  // Remove flashing and winner highlight from all team cards
  document.querySelectorAll(".team-card").forEach(function (card) {
    card.classList.remove("flash");
    card.classList.remove("winner");
  });

  // If tie, flash both and show "Tie!" message
  let message = "";
  if (winners.length > 1) {
    for (let i = 0; i < winners.length; i++) {
      document.querySelector(`.team-card.${winners[i]}`).classList.add("flash");
    }
    message = "Tie!";
    greeting.textContent = message;
    greeting.classList.add("success-message");
    greeting.style.display = "block";
  } else {
    // Only one winner
    document.querySelector(`.team-card.${winners[0]}`).classList.add("winner");
    message = `🎉 Attendance goal reached! ${
      teamSelect.querySelector(`[value="${winners[0]}"]`).textContent
    } wins! 🎉`;
    greeting.textContent = message;
    greeting.classList.add("success-message");
    greeting.style.display = "block";
    showConfetti();
  }

  // Save goal status, message, and winner(s) to localStorage
  localStorage.setItem("goalReached", "true");
  localStorage.setItem("goalMessage", message);
  localStorage.setItem("winnerTeams", JSON.stringify(winners));
}



