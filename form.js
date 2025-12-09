// ✅ LINE SET tab (fetch data)
const fetchUrl = "https://script.google.com/macros/s/AKfycbzUecmsk_6IsegFyyYrRg6MhIL6NA5-KWF5aJEa4XgK4ACvn9P3ihhfUL0mSqmq6CIcgw/exec";

// ✅ OUTPUT tab (save line setup)
const saveLineUrl = "https://script.google.com/macros/s/AKfycby0fR6yKQIMiVj8Ry-hPZi8O9yQy7vz0to7DoxX1NWEqPMoqu7c0TSsWSLHK68RVqipOQ/exec";
// ✅ FINAL OUTPUT tab (save report data)
const finalOutputUrl = "https://script.google.com/macros/s/AKfycbwis0WVbQ4bGDDxq0rO6Xzp6WnXKIuEN4kHSfzdyh-zAsjAgqV5k80tR-KYwP_T0pibpQ/exec";


// ✅ DOM refs
const lineSelect = document.getElementById("lineSelect");
const addEmployeeBtn = document.getElementById("addEmployeeBtn");
const setLineBtn = document.getElementById("setLineBtn");
const setLineMsg = document.getElementById("setLineMsg");
const employeeTableBody = document.getElementById("employeeTableBody");
const lineTableContainer = document.getElementById("lineTableContainer");
const lineSetupDate = document.getElementById("lineSetupDate");
const manualAddBtn = document.getElementById("manualAddBtn");
const editLineBtn = document.getElementById("editLineBtn");
const showLineContainer = document.getElementById("showLineContainer");
const showLineSelect = document.getElementById("showLineSelect");

// ✅ Defaults
if (lineSetupDate) {
  lineSetupDate.value = new Date().toISOString().split("T")[0];
}

let rtfSheetData = [];
const lineEmployeesByDate = {}; // { "2025-12-08": { "1": [...], "2": [...] } }
const usedEmployeesByDate = {}; // { "2025-12-08": ["ANITA","RAHUL"] }

// -----------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function getVal(row, key) {
  const keyMap = {
    "EMPLOYEE NAME": ["EMPLOYEE NAME", "Employee Name", "Emp Name", "Name"],
    "ACTIVITY": ["ACTIVITY", "Activity", "Activity Type"],
    "EMPLOYEE CODE": [
      "EMPLOYEE CODE", "Employee Code", "Code", "Emp Code", "Code No", "Code:", "EMPLOYEE CODE ", "Employee code", "employee code"
    ],
    "LINE NO": ["LINE NO", "LINE NO.", "Line No", "Line"]
  };
  const possibleKeys = keyMap[key] || [key];
  for (const k of possibleKeys) {
    if (row[k] && row[k].toString().trim()) return row[k].toString().trim();
  }
  return "";
}

function findRtfMatches(lastDigits) {
  if (!lastDigits || !rtfSheetData || rtfSheetData.length === 0) return [];
  const padded = lastDigits.toString().padStart(3, "0");
  const fullRtf = `RTF/000${padded}`;
  return rtfSheetData.filter(r => getVal(r, "RTF NO.") === fullRtf);
}



async function loadEmployees() {
  try {
    const response = await fetch(fetchUrl);
    const rows = await response.json();

    const cleanRows = rows.filter(r => {
      const name = getVal(r, "EMPLOYEE NAME");
      const activity = getVal(r, "ACTIVITY");
      return name && activity;
    });

    rtfSheetData = cleanRows;
    if (setLineMsg) setLineMsg.innerText = "";
  } catch (e) {
    console.error("❌ Failed to load employees:", e);
    if (setLineMsg) setLineMsg.innerText = "⚠️ Failed to load employees.";
  }
}

function isEmployeeUsed(name, date) {
  return usedEmployeesByDate[date]?.includes(name);
}

function syncTableToArray(date, line) {
  if (!date || !line) return;
  if (!lineEmployeesByDate[date]) lineEmployeesByDate[date] = {};
  if (!lineEmployeesByDate[date][line]) lineEmployeesByDate[date][line] = [];

  const rows = employeeTableBody.querySelectorAll("tr");
  const synced = [];

  rows.forEach(row => {
    const inputs = row.querySelectorAll(".emp-input");
    let name = "", activity = "", code = "";
    if (inputs.length > 0) {
      name = inputs[0].value.trim();
      activity = inputs[1].value.trim();
      code = inputs[2].value.trim();
    } else {
      const cells = row.querySelectorAll("td");
      name = (cells[0]?.innerText || "").trim();
      activity = (cells[1]?.innerText || "").trim();
      code = (cells[2]?.innerText || "").trim();
    }
    if (!name && !activity && !code) return;
    synced.push({ name, activity, code });
  });

  lineEmployeesByDate[date][line] = synced;
}
// ------------------------------------------------------------
// Activity + employee rendering
// ------------------------------------------------------------
function getSelectedActivities() {
  return Array.from(document.querySelectorAll("#activityCheckboxGroup input:checked"))
    .map(cb => cb.value.trim().toUpperCase())
    .filter(Boolean);
}

const activityToggle = document.getElementById("activityToggle");
if (activityToggle) {
  activityToggle.addEventListener("click", async () => {
    const activityGroup = document.getElementById("activityCheckboxGroup");
    const employeeGroup = document.getElementById("employeeCheckboxGroup");
    if (!activityGroup) return;

    const isVisible = activityGroup.style.display === "block";
    activityGroup.style.display = isVisible ? "none" : "block";
    if (employeeGroup) employeeGroup.style.display = "none";

    if (!isVisible) {
      // ✅ Position panel just below the Activity button
      const rect = activityToggle.getBoundingClientRect();
      activityGroup.style.top = `${rect.bottom + window.scrollY + 24}px`;  // 24px below button
      activityGroup.style.left = `${rect.left + window.scrollX}px`;        // align left with button

      if (!rtfSheetData || rtfSheetData.length === 0) {
        setLineMsg.innerText = "⏳ Please wait, data is still loading...";
        await loadEmployees();
      }
      if (rtfSheetData.length > 0) {
        renderActivityCheckboxes([...rtfSheetData]);
      }
    }
  });
}

const employeeToggle = document.getElementById("employeeToggle");
if (employeeToggle) {
  employeeToggle.addEventListener("click", () => {
    const employeeGroup = document.getElementById("employeeCheckboxGroup");
    const activityGroup = document.getElementById("activityCheckboxGroup");
    if (!employeeGroup) return;

    const isVisible = employeeGroup.style.display === "block";
    employeeGroup.style.display = isVisible ? "none" : "block";
    if (activityGroup) activityGroup.style.display = "none";

    if (!isVisible) {
      // ✅ Position panel just below the Employee button
      const rect = employeeToggle.getBoundingClientRect();
      employeeGroup.style.top = `${rect.bottom + window.scrollY + 24}px`;  // 24px below button
      employeeGroup.style.left = `${rect.left + window.scrollX-40}px`;        // align left with button
    }
  });
}

function renderActivityCheckboxes(rows) {
  const container = document.getElementById("activityCheckboxGroup");
  if (!container) return;

  const allActivities = [...new Set(rows.map(r => getVal(r, "ACTIVITY")).filter(Boolean))];
  container.innerHTML = "";

  if (allActivities.length === 0) {
    container.innerHTML = "<em>No activities found. Please check your sheet data.</em>";
    container.style.display = "block";
    setLineMsg.innerText = "";
    return;
  }

  allActivities.forEach(act => {
    const label = document.createElement("label");
    label.style.display = "block";
    label.innerHTML = `
      <input type="checkbox" value="${act.trim()}">
      ${act.trim()}
    `;
    container.appendChild(label);
  });

  setLineMsg.innerText = "";
  container.style.display = "block";

  container.addEventListener("change", () => {
    renderEmployeeCheckboxes(rows);
    const employeeGroup = document.getElementById("employeeCheckboxGroup");
    if (employeeGroup) employeeGroup.style.display = "block";
  });
}

function renderEmployeeCheckboxes(rows) {
  const selectedActs = getSelectedActivities();
  const container = document.getElementById("employeeCheckboxGroup");
  if (!container) return;

  container.innerHTML = "";
  const date = lineSetupDate?.value;
  const matching = [];
  const others = [];
  const seen = new Set();

  rows.forEach(r => {
    const name = getVal(r, "EMPLOYEE NAME");
    const act = getVal(r, "ACTIVITY");
    const code = getVal(r, "EMPLOYEE CODE") || "";
    const key = `${name}-${code}`;
    if (!name || seen.has(key)) return;
    seen.add(key);
    if (isEmployeeUsed(name, date)) return;
    const empObj = { name, act, code };
    if (selectedActs.includes((act || "").toUpperCase())) matching.push(empObj);
    else others.push(empObj);
  });

  [...matching, ...others].forEach(emp => {
    const label = document.createElement("label");
    label.style.display = "block";
    label.innerHTML = `
      <input type="checkbox"
             class="employeeCheck"
             data-name="${emp.name}"
             data-activity="${emp.act}"
             data-code="${emp.code}">
      ${emp.name} (${emp.act}${emp.code ? " | " + emp.code : ""})
    `;
    container.appendChild(label);
  });

  setLineMsg.innerText = "";
  container.style.display = "block";
}


// ------------------------------------------------------------
// Table render + save
// ------------------------------------------------------------
function renderTable(date, line) {
  const employees = lineEmployeesByDate[date]?.[line] || [];
  employeeTableBody.innerHTML = "";
  employees.forEach((emp, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${emp.name}</td>
      <td>${emp.activity}</td>
      <td>${emp.code || ""}</td>
      <td><button class="cut-btn" data-index="${index}" title="Remove row">x</button></td>
    `;
    employeeTableBody.appendChild(row);
  });
  lineTableContainer.style.display = "block";
}

async function saveToSheet(line, employees) {
  const date = lineSetupDate?.value || new Date().toISOString().split("T")[0];
  const payload = employees.map(emp => ({
    "Date": date,
    "LINE NO": `Line No.${line}`,
    "EMPLOYEE NAME": emp.name,
    "ACTIVITY": emp.activity,
    "EMPLOYEE CODE": emp.code
  }));
  try {
    await fetch(saveLineUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("✅ Line data saved to sheet");
  } catch (err) {
    console.error("❌ Failed to save line data:", err);
  }
}

// ------------------------------------------------------------
// Add selected employees
// ------------------------------------------------------------
if (addEmployeeBtn) {
  addEmployeeBtn.addEventListener("click", () => {
    const line = lineSelect.value;
    const date = lineSetupDate?.value;
    if (!line || !date) {
      setLineMsg.innerText = "⚠️ Please select line and date first.";
      return;
    }
    if (!lineEmployeesByDate[date]) lineEmployeesByDate[date] = {};
    if (!lineEmployeesByDate[date][line]) lineEmployeesByDate[date][line] = [];

    const selected = Array.from(document.querySelectorAll("#employeeCheckboxGroup .employeeCheck:checked"));
    if (selected.length === 0) {
      setLineMsg.innerText = "⚠️ Please select at least one employee.";
      return;
    }

    selected.forEach(cb => {
      const name = cb.dataset.name;
      const activity = cb.dataset.activity;
      const code = cb.dataset.code || "";
      if (isEmployeeUsed(name, date)) return;
      lineEmployeesByDate[date][line].push({ name, activity, code });
      if (!usedEmployeesByDate[date]) usedEmployeesByDate[date] = [];
      usedEmployeesByDate[date].push(name);
    });

    renderTable(date, line);
    setLineMsg.innerText = `✅ Added ${selected.length} employee(s) to Line No.${line} for ${date}`;
    document.getElementById("lineActionGroup").style.display = "block";

  });
}

// ------------------------------------------------------------
// Set Line with time-slot deduplication + Show Line dropdown
// ------------------------------------------------------------
// ------------------------------------------------------------
// Set Line with date-based deduplication + Show Line dropdown
// ------------------------------------------------------------
if (setLineBtn) {
  setLineBtn.addEventListener("click", () => {
    const line = lineSelect.value;
    const date = lineSetupDate?.value;

    if (!line || !date) {
      setLineMsg.innerText = "⚠️ Please select line and date first.";
      return;
    }

    syncTableToArray(date, line);
    if (!lineEmployeesByDate[date]) lineEmployeesByDate[date] = {};
    lineEmployeesByDate[date][line] = []; // reset

    // Gather rows (manual inputs or plain cells)
    const rows = employeeTableBody.querySelectorAll("tr");
    rows.forEach(row => {
      const inputs = row.querySelectorAll(".emp-input");
      let name, activity, code;
      if (inputs.length > 0) {
        name = inputs[0].value.trim();
        activity = inputs[1].value.trim();
        code = inputs[2].value.trim();
      } else {
        const cells = row.querySelectorAll("td");
        name = cells[0].innerText.trim();
        activity = cells[1].innerText.trim();
        code = cells[2].innerText.trim();
      }
      if (!name || !activity) return;
      lineEmployeesByDate[date][line].push({ name, activity, code });
      localStorage.setItem("lineEmployeesByDate", JSON.stringify(lineEmployeesByDate));

      if (!usedEmployeesByDate[date]) usedEmployeesByDate[date] = [];
      usedEmployeesByDate[date].push(name);
    });

    const employees = lineEmployeesByDate[date][line];
    if (employees.length === 0) {
      setLineMsg.innerText = "⚠️ Please add at least one employee.";
      return;
    }

    renderTable(date, line);
    setLineMsg.innerText = `✅ Line No.${line} set with ${employees.length} employee(s) on ${date}`;
    localStorage.setItem("lastLineSet", line);

    // Save to sheet
    saveToSheet(line, employees);

    // Hide table after setting line
    lineTableContainer.style.display = "none";

    // Show and populate Show Line dropdown
    if (showLineContainer && showLineSelect) {
      if (![...showLineSelect.options].some(opt => opt.value === `${date}__${line}`)) {
        const opt = document.createElement("option");
        opt.value = `${date}__${line}`;
        opt.text = `Line No.${line} (${date})`;
        showLineSelect.appendChild(opt);
      }
      showLineSelect.value = "";
      showLineContainer.style.display = "block";
    }
  });
}

// ------------------------------------------------------------
// Refresh Button
// ------------------------------------------------------------
const refreshBtn = document.getElementById("refreshBtn");
if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    const date = lineSetupDate?.value;

    if (lineTableContainer) lineTableContainer.style.display = "none";
    const activityGroup = document.getElementById("activityCheckboxGroup");
    const employeeGroup = document.getElementById("employeeCheckboxGroup");
    if (activityGroup) activityGroup.style.display = "none";
    if (employeeGroup) employeeGroup.style.display = "none";

    document.querySelectorAll("#activityCheckboxGroup input, #employeeCheckboxGroup input")
      .forEach(cb => cb.checked = false);

    if (setLineMsg) setLineMsg.innerText = "";
    if (showLineSelect) showLineSelect.value = "";
    if (lineSelect) lineSelect.value = "";
    if (lineSetupDate) lineSetupDate.value = date;
  });
}
if (editLineBtn) {
  editLineBtn.addEventListener("click", () => {
    const line = lineSelect.value;
    const date = lineSetupDate?.value;
    const employees = lineEmployeesByDate[date]?.[line] || [];
    employeeTableBody.innerHTML = "";

    employees.forEach((emp, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input class="emp-input" value="${emp.name}" /></td>
        <td><input class="emp-input" value="${emp.activity}" /></td>
        <td><input class="emp-input" value="${emp.code || ""}" /></td>
        <td><button class="cut-btn" data-index="${index}" title="Remove row">x</button></td>
      `;
      employeeTableBody.appendChild(row);
    });

    lineTableContainer.style.display = "block";
    setLineMsg.innerText = `✏️ Editing Line No.${line} (${date})`;
  });
}
if (manualAddBtn) {
  manualAddBtn.addEventListener("click", () => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input class="emp-input" placeholder="Name" /></td>
      <td><input class="emp-input" placeholder="Activity" /></td>
      <td><input class="emp-input" placeholder="Code" /></td>
      <td><button class="cut-btn" title="Remove row">x</button></td>
    `;
    employeeTableBody.appendChild(row);
    lineTableContainer.style.display = "block";
  });
}

// ------------------------------------------------------------
// Show Line dropdown handler
// ------------------------------------------------------------
if (showLineSelect) {
  showLineSelect.addEventListener("change", () => {
    // Dropdown option value format: "2025-12-08__1"
    const [date, line] = showLineSelect.value.split("__");
    const employees = lineEmployeesByDate[date]?.[line] || [];
    if (!line || employees.length === 0) {
      setLineMsg.innerText = "⚠️ No data found for selected line.";
      return;
    }
    renderTable(date, line);
    lineTableContainer.style.display = "block";
    setLineMsg.innerText = `📋 Showing Line No.${line} (${date})`;
  });
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("cut-btn")) {
    const index = parseInt(e.target.dataset.index);
    const line = lineSelect.value;
    const date = lineSetupDate?.value;
    if (!date || !line || isNaN(index)) return;

    const list = lineEmployeesByDate[date]?.[line];
    if (list && list.length > index) {
      // ✅ Get removed employee name before splice
      const removedEmp = list[index]?.name;

      // ✅ Remove from lineEmployees array
      list.splice(index, 1);

      // ✅ Also remove from usedEmployeesByDate so employee can be reused
      if (removedEmp && usedEmployeesByDate[date]) {
        usedEmployeesByDate[date] = usedEmployeesByDate[date].filter(n => n !== removedEmp);
      }

      // ✅ Re-render table
      renderTable(date, line);

      setLineMsg.innerText = `❌ Removed employee (${removedEmp}) from Line No.${line} (${date})`;
    }
  }
});

document.addEventListener("input", (e) => {
  if (!e.target.classList.contains("rtf-input")) return;

  const lastDigits = e.target.value.trim();
  const matches = findRtfMatches(lastDigits);
  if (matches.length === 0) return;

  const row = e.target.closest("tr");
  if (!row) return;

  // ✅ Update input field to full RTF
  const fullRtf = `RTF/000${lastDigits.padStart(3, "0")}`;
  e.target.value = fullRtf;

  // ✅ Extract values
  const style = getVal(matches[0], "STYLE NO.");
  const colors = [...new Set(matches.map(m => getVal(m, "COLOR")).flatMap(c => c.split(",").map(x => x.trim())))].filter(Boolean);
  const comps = [...new Set(matches.map(m => getVal(m, "COMPONENT")).flatMap(c => c.split(",").map(x => x.trim())))].filter(Boolean);

  // ✅ Always fill current row
  fillRow(row, style, colors, comps);

  // ✅ If first row, broadcast to others only if blank
  const allRows = Array.from(document.querySelectorAll("#reportTableBody tr"));
  if (row === allRows[0]) {
    allRows.slice(1).forEach(r => {
      const rtfInput = r.querySelector(".rtf-input");
      if (rtfInput && !rtfInput.value.trim()) {
        rtfInput.value = fullRtf;
        fillRow(r, style, colors, comps);
      }
    });
  }
});
document.addEventListener("input", (e) => {
  const row = e.target.closest("tr");
  if (!row) return;

  const passInput = row.querySelector(".pass-input");
  const alterInput = row.querySelector(".alter-input");
  const targetInput = row.querySelector(".target-input");
  const achievedInput = row.querySelector(".achieved-input");
  const alterPercentInput = row.querySelector(".alter-percent-input");

  const passVal = parseInt(passInput?.value.trim()) || 0;
  const alterVal = parseInt(alterInput?.value.trim()) || 0;
  const targetVal = parseInt(targetInput?.value.trim()) || 0;

  if (achievedInput) {
    achievedInput.value = passVal + alterVal;
  }

  if (alterPercentInput) {
  const achievedVal = parseInt(achievedInput?.value.trim()) || 0;
  const percent = achievedVal > 0 ? ((alterVal / achievedVal) * 100).toFixed(1) : "";
  alterPercentInput.value = percent;
}

});

// ✅ Helper to fill style, color, component in a row
function fillRow(row, style, colors, comps) {
  const styleCell = row.querySelector(".style-cell");
  if (styleCell) styleCell.innerText = style;

  const colorCell = row.querySelector(".color-cell");
  if (colorCell) {
    colorCell.innerHTML = "";
    const select = document.createElement("select");
    select.className = "color-select";
    colors.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.text = c;
      select.appendChild(opt);
    });
    colorCell.appendChild(select);
  }

  const compCell = row.querySelector(".component-cell");
  if (compCell) {
    compCell.innerHTML = "";
    const select = document.createElement("select");
    select.className = "component-select"; 
    comps.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.text = c;
      select.appendChild(opt);
    });
    compCell.appendChild(select);
  }
}


// ------------------------------------------------------------
// On load
// ------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadEmployees();
  if (lineSetupDate) {
    lineSetupDate.value = new Date().toISOString().split("T")[0];
  }
  const savedLineData = localStorage.getItem("lineEmployeesByDate");
if (savedLineData) {
  try {
    Object.assign(lineEmployeesByDate, JSON.parse(savedLineData));
  } catch (e) {
    console.warn("⚠️ Failed to restore saved line data:", e);
  }
}

});
// ------------------------------------------------------------
// Line Reporting auto-fill (Date + Line)
// ------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  // ✅ Auto-set today's date in Line Reporting
  const reportDate = document.getElementById("reportDate");
  if (reportDate) {
    reportDate.value = new Date().toISOString().split("T")[0];
  }

  // ✅ Auto-select last used line from Line Set-Up
  const lastLine = localStorage.getItem("lastLineSet");
  const reportLineSelect = document.getElementById("reportLineSelect");
  if (reportLineSelect && lastLine) {
    reportLineSelect.value = lastLine;
  }

  // ✅ Optional: auto-load report if both date and line are set
  const loadBtn = document.getElementById("loadReportBtn");
  if (reportDate?.value && reportLineSelect?.value && loadBtn) {
    // Agar tum chaho to auto-load karwa sakti ho
    // loadBtn.click();
  }
});

function normalizeDate(val) {
  if (!val) return "";
  const s = val.toString().trim();

  // If format is yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [yyyy, mm, dd] = s.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }
  // If format is dd/mm/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    return `${dd.padStart(2,"0")}-${mm.padStart(2,"0")}-${yyyy}`;
  }
  return s;
}

function normalizeLine(val) {
  if (!val) return "";
  const digits = val.toString().replace(/[^0-9]/g,"");
  return digits.padStart(2,"0"); // "3" → "03"
}

// ------------------------------------------------------------
// Line Reporting logic
// ------------------------------------------------------------
async function loadReportData() {
  try {
    const response = await fetch(fetchUrl); // ✅ ye tumhara naya link hai
    const rows = await response.json();
    return rows;
  } catch (err) {
    console.error("❌ Failed to load report data:", err);
    return [];
  }
}

const loadReportBtn = document.getElementById("loadReportBtn");
if (loadReportBtn) {
  loadReportBtn.addEventListener("click", async () => {
    const rawDate = document.getElementById("reportDate")?.value;
    const line = document.getElementById("reportLineSelect")?.value;

    if (!rawDate || !line) {
      alert("⚠️ Please select both date and line.");
      return;
    }

    // ✅ Normalize date from dd-mm-yyyy → yyyy-mm-dd
    let date = rawDate;
    const parts = rawDate.split("-");
    if (parts.length === 3 && parts[0].length <= 2) {
      const dd = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      const yyyy = parts[2];
      date = `${yyyy}-${mm}-${dd}`;
    }

    const data = await loadReportData();
    console.log("Selected date:", date);
    console.log("Selected line:", `Line No.${line}`);
    console.log("Sample row:", data[0]);

    const filtered = data.filter(r => {
      const sheetDate = (r["Date"] || r["DATE"] || "").trim();
      const rawLine = (r["LINE NO"] || r["LINE NO."] || r["Line No"] || "").trim();
      return sheetDate === date && rawLine === `Line No.${line}`;
    });
const container = document.getElementById("reportTableContainer");
const tbody = document.getElementById("reportTableBody");
tbody.innerHTML = "";

// ✅ Always fetch from OUTPUT tab (lineEmployeesByDate)
const employees = lineEmployeesByDate[date]?.[line] || [];

if (employees.length === 0) {
  container.style.display = "block";
  tbody.innerHTML = `<tr><td colspan="12">⚠️ No employees found for ${date} Line No.${line}</td></tr>`;
  return;
}

// ✅ Render only Employee Name + Activity, keep headers intact
employees.forEach(emp => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="name-cell">${emp.name}</td>
    <td class="activity-cell">${emp.activity}</td>
    <td><input class="rtf-input" placeholder="Enter last 3 digits" /></td>
    <td class="style-cell"></td>
    <td class="color-cell"></td>
    <td class="component-cell"></td>
    <td><input class="balance-input" /></td>
<td><input class="target-input" /></td>
<td><input class="pass-input" /></td>
<td><input class="alter-input" /></td>
<td><input class="alter-percent-input" readonly /></td>
<td><input class="achieved-input" readonly /></td>

  `;
  tbody.appendChild(row);
});


container.style.display = "block";
setLineMsg.innerText = `📋 Showing Line No.${line} (${date}) from OUTPUT tab`;


    filtered.forEach(r => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${r["EMPLOYEE NAME"] || ""}</td>
        <td>${r["ACTIVITY"] || ""}</td>
        <td>${r["RTF NO."] || ""}</td>
        <td>${r["STYLE NO."] || ""}</td>
        <td>${r["COLOR"] || ""}</td>
        <td>${r["COMPONENT"] || ""}</td>
        <td>${r["BALANCE QTY,"] || r["BALANCE QTY"] || r["QTY,"] || ""}</td>
        <td>${r["Target"] || ""}</td>
        <td>${r["Pass Pcs."] || ""}</td>
        <td>${r["Alter Pcs."] || ""}</td>
        <td>${r["Alter %"] || ""}</td>
        <td>${r["Achieved qty."] || r["TOTAL PASS QTY,"] || ""}</td>
      `;
      tbody.appendChild(row);
    });

    container.style.display = "block";
  });
}
const submitReportBtn = document.getElementById("submitReportBtn");
if (submitReportBtn) {
  submitReportBtn.addEventListener("click", async () => {
    const date = document.getElementById("reportDate")?.value || "";
    const time = document.getElementById("globalTime")?.value || "";
    const rows = document.querySelectorAll("#reportTableBody tr");

    const payload = [];

    rows.forEach(row => {
      payload.push({
        "Date": date,
        "Time": time,
        "Employee Name": row.querySelector(".name-cell")?.innerText || "",
        "Activity": row.querySelector(".activity-cell")?.innerText || "",
        "RTF No.": row.querySelector(".rtf-input")?.value || "",
        "Style No.": row.querySelector(".style-cell")?.innerText || "",
        "Color": row.querySelector(".color-cell select")?.value || "",
        "Component": row.querySelector(".component-cell select")?.value || "",
        "Balance": row.querySelector(".balance-input")?.value || "",
        "Target": row.querySelector(".target-input")?.value || "",
        "Pass Pcs.": row.querySelector(".pass-input")?.value || "",
        "Alter Pcs.": row.querySelector(".alter-input")?.value || "",
        "Alter %": row.querySelector(".alter-percent-input")?.value || "",
        "Achieved qty.": row.querySelector(".achieved-input")?.value || ""
      });
    });

    try {
      await fetch(finalOutputUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("✅ Report submitted successfully!");
    } catch (err) {
      console.error("❌ Failed to submit report:", err);
      alert("⚠️ Failed to submit report. Please try again.");
    }
  });
}
// ✅ Line Reporting Refresh → Go to index.html
const refreshBtnReport = document.getElementById("refreshBtn");
if (refreshBtnReport && document.getElementById("reportTableContainer")) {
  refreshBtnReport.addEventListener("click", () => {
    window.location.href = "index.html"; // 👈 starting page
  });
}

