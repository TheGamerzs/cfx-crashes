async function fetchAllIssues() {
  return issues;
}

async function fetchIssueCounts() {
  try {
    let crashIssues = [];
    let baseUrl =
      "https://api.github.com/repos/citizenfx/fivem/issues?state=all&labels=crash&per_page=100&page=";

    let page = 1;

    while (true) {
      const response = await fetch(baseUrl + page);
      const data = await response.json();

      crashIssues = crashIssues.concat(data);
      page++;

      if (data.length < 100) {
        break;
      }
    }

    const notCrashCounter = crashIssues.filter(
      (issue) =>
        issue.body.includes("### Expected result") &&
        issue.body
          .split("### Expected result")[1]
          .split("###")[0]
          .trim()
          .includes("crash")
    ).length;

    document.getElementById("crash-issues").innerText =
      crashIssues.length - notCrashCounter;
  } catch (error) {
    console.error(error);
    document.getElementById("crash-issues").innerText = "Error fetching issues";
  }
}

fetchIssueCounts();
