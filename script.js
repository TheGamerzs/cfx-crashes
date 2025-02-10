let activeFilters = new Set();

function codeBlockSpan(code) {
	return `<code class="bg-gray-800 px-2 py-0.5 rounded text-blue-300 font-mono text-xs whitespace-pre-wrap leading-relaxed inline-block my-0.5 border border-gray-700 transition-all duration-200 hover:border-blue-500/30 hover:bg-gray-800/80">${code}</code>`;
}

function formatExpectedResult(expectedResult) {
	return expectedResult.replace(/`([^`]+)`/g, (match, code) => {
		const formattedCode = code
			.split("\n")
			.map((line) => line.trim())
			.join("\n");
		return codeBlockSpan(formattedCode);
	});
}

function updateFilterButtons() {
	["open", "closed"].forEach((state) => {
		const filterBtn = $(`#filter-${state}`);
		if (activeFilters.has(state)) {
			const color = state === "open" ? "2EA44F" : "8957E5";
			filterBtn
				.css({
					"box-shadow": `0 0 0 2px #${color}90`,
					transform: "scale(1.05)",
				})
				.html(`${state} <span class="ml-1">✓</span>`);
		} else {
			filterBtn
				.css({
					"box-shadow": "",
					transform: "",
				})
				.text(state);
		}
	});
}

function updateCounters(filteredIssues, notCrashIssues) {
	const crashIssues = $("#crash-issues");
	const totalIssues = $("#total-issues");

	crashIssues.addClass("updating");
	totalIssues.addClass("updating");

	setTimeout(() => {
		crashIssues.text(filteredIssues.length);
		totalIssues.text(notCrashIssues.length);

		requestAnimationFrame(() => {
			crashIssues.removeClass("updating");
			totalIssues.removeClass("updating");
		});
	}, 50);
}

function formatIssueHTML(issue) {
	const expectedResult = issue.body
		.split("### Expected result")[1]
		.split("###")[0]
		.trim();

	return `
        <li class="border-b border-gray-700 p-4">
            <div class="mb-2 flex items-center justify-between">
                <a href="${
					issue.html_url
				}" target="_blank" class="group flex-grow">
                    <h3 class="font-semibold inline-flex items-center text-white group-hover:text-blue-400 transition-all duration-300 ease-out group-hover:translate-x-0.5">
                        <span class="mr-1 relative after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-full after:origin-bottom-left after:scale-x-0 after:bg-blue-400 after:transition-transform after:duration-300 after:ease-out group-hover:after:scale-x-100">#${
							issue.number
						} - ${formatExpectedResult(issue.title)}</span>
                        <svg class="w-4 h-4 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                    </h3>
                </a>
                <span class="inline-block px-2 py-1 text-xs font-medium rounded-full ml-2 transition-all duration-200 hover:scale-105"
                    style="background-color: #${
						issue.state === "open" ? "2EA44F15" : "8957E515"
					}; 
                           color: #${
								issue.state === "open" ? "2EA44F" : "8957E5"
							}; 
                           border: 1px solid #${
								issue.state === "open" ? "2EA44F30" : "8957E530"
							}">
                    ${issue.state}
                </span>
            </div>
            <div class="text-sm text-gray-400 mb-2">
                Created by ${issue.user.login} on ${new Date(
		issue.created_at
	).toLocaleDateString()}
            </div>
            <div class="text-sm mt-2 bg-gray-700 p-2 rounded">
                <span class="text-gray-300">Expected Result:</span>
                <div class="mt-2 pt-1">${formatExpectedResult(
					expectedResult
				)}</div>
            </div>
        </li>
    `;
}

function updateIssuesList(filteredIssues, notCrashIssues) {
	const issuesList = $("#issues-list");
	const filterInfo = $("#filter-info");
	const clearFiltersBtn = $("#clear-filters");

	const currentHeight = issuesList.height();
	issuesList.css("min-height", `${currentHeight}px`).addClass("updating");

	updateFilterButtons();
	updateCounters(filteredIssues, notCrashIssues);

	filterInfo.css("opacity", activeFilters.size > 0 ? "1" : "0");
	clearFiltersBtn.toggleClass("visible", activeFilters.size > 0);

	setTimeout(() => {
		issuesList.html(filteredIssues.map(formatIssueHTML).join(""));

		requestAnimationFrame(() => {
			issuesList.removeClass("updating");
			setTimeout(() => {
				issuesList.css("min-height", "auto");
			}, 150);
		});
	}, 150);
}

function filterIssues(notCrashIssues) {
	return activeFilters.size === 0
		? notCrashIssues
		: notCrashIssues.filter((issue) => {
				const issueLabels = new Set([issue.state]);
				return Array.from(activeFilters).every((filter) =>
					issueLabels.has(filter)
				);
		  });
}

async function fetchGitHubIssues(baseUrl, page = 1, accumulator = []) {
	const response = await fetch(baseUrl + page);
	const data = await response.json();

	if (data.length < 100) {
		return [...accumulator, ...data];
	}

	return fetchGitHubIssues(baseUrl, page + 1, [...accumulator, ...data]);
}

function handleFilterToggle(labelName, notCrashIssues) {
	if (activeFilters.has(labelName)) {
		activeFilters.delete(labelName);
	} else {
		activeFilters.clear();
		activeFilters.add(labelName);
	}

	const filteredIssues = filterIssues(notCrashIssues);
	updateIssuesList(filteredIssues, notCrashIssues);
}

async function fetchIssueCounts() {
	try {
		const baseUrl =
			"https://api.github.com/repos/citizenfx/fivem/issues?state=all&labels=crash&per_page=100&page=";
		const crashIssues = await fetchGitHubIssues(baseUrl);

		const notCrashIssues = crashIssues.filter(
			(issue) =>
				issue.body?.includes("### Expected result") &&
				issue.body
					.split("### Expected result")[1]
					.split("###")[0]
					.trim()
					.includes("crash")
		);

		// Initial render
		updateIssuesList(notCrashIssues, notCrashIssues);

		// Add clear filters function
		$("#clear-filters").on("click", () => {
			activeFilters.clear();
			updateIssuesList(notCrashIssues, notCrashIssues);
		});

		// Add filter toggle function to window scope
		window.toggleFilter = (labelName) =>
			handleFilterToggle(labelName, notCrashIssues);
	} catch (error) {
		console.error(error);
		$("#crash-issues").text("Error fetching issues");
		$("#issues-list").html("<li class='p-4'>Error loading issues</li>");
	}
}

$(document).ready(() => {
	fetchIssueCounts();
});
