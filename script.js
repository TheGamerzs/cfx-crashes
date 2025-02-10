let activeFilters = new Set();

async function fetchAllIssues() {
	return issues;
}

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

		const notCrashIssues = crashIssues.filter(
			(issue) =>
				issue.body?.includes("### Expected result") &&
				issue.body
					.split("### Expected result")[1]
					.split("###")[0]
					.trim()
					.includes("crash")
		);

		function updateIssuesList(filteredIssues = notCrashIssues) {
			const issuesList = document.getElementById("issues-list");
			const filterInfo = document.getElementById("filter-info");
			const totalIssues = document.getElementById("total-issues");
			const crashIssues = document.getElementById("crash-issues");
			const clearFiltersBtn = document.getElementById("clear-filters");

			// Add updating class to counters
			crashIssues.classList.add("updating");
			totalIssues.classList.add("updating");

			// Store the current height and add updating class
			const currentHeight = issuesList.offsetHeight;
			issuesList.style.minHeight = `${currentHeight}px`;
			issuesList.classList.add("updating");

			// Update filter buttons appearance
			["open", "closed"].forEach((state) => {
				const filterBtn = document.getElementById(`filter-${state}`);
				if (activeFilters.has(state)) {
					const color = state === "open" ? "2EA44F" : "8957E5";
					filterBtn.style.boxShadow = `0 0 0 2px #${color}90`;
					filterBtn.style.transform = "scale(1.05)";
					filterBtn.innerHTML = `${state} <span class="ml-1">✓</span>`;
				} else {
					filterBtn.style.boxShadow = "";
					filterBtn.style.transform = "";
					filterBtn.textContent = state;
				}
			});

			// Delay the counter updates slightly
			setTimeout(() => {
				crashIssues.innerText = filteredIssues.length;
				totalIssues.innerText = notCrashIssues.length;

				// Remove updating class from counters
				requestAnimationFrame(() => {
					crashIssues.classList.remove("updating");
					totalIssues.classList.remove("updating");
				});
			}, 50);

			// Always update filter info text before transition
			filterInfo.style.opacity = activeFilters.size > 0 ? "1" : "0";
			clearFiltersBtn.classList.toggle("visible", activeFilters.size > 0);

			// Delay content update slightly to allow transition
			setTimeout(() => {
				// Update content
				issuesList.innerHTML = filteredIssues
					.map((issue) => {
						const expectedResult = issue.body
							.split("### Expected result")[1]
							.split("###")[0]
							.trim();

						return `
							<li class="border-b border-gray-700 p-4">
								<div class="mb-2 flex items-center justify-between">
									<a href="${issue.html_url}" target="_blank" class="group flex-grow">
										<h3 class="font-semibold inline-flex items-center text-white group-hover:text-blue-400 transition-all duration-300 ease-out group-hover:translate-x-0.5">
											<span class="mr-1 relative after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-full after:origin-bottom-left after:scale-x-0 after:bg-blue-400 after:transition-transform after:duration-300 after:ease-out group-hover:after:scale-x-100">#${
												issue.number
											} - ${issue.title}</span>
											<svg class="w-4 h-4 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
											</svg>
										</h3>
									</a>
									<span class="inline-block px-2 py-1 text-xs font-medium rounded-full ml-2 transition-all duration-200 hover:scale-105"
										style="background-color: #${issue.state === "open" ? "2EA44F15" : "8957E515"}; 
											   color: #${issue.state === "open" ? "2EA44F" : "8957E5"}; 
											   border: 1px solid #${issue.state === "open" ? "2EA44F30" : "8957E530"}">
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
									<div class="mt-1 pb-2 border-b border-gray-600">
										<code class="bg-gray-800 px-2 py-0.5 rounded text-pink-400 font-mono text-xs whitespace-pre-wrap leading-relaxed inline-block my-0.5 border border-gray-700 transition-all duration-200 hover:border-pink-500/30 hover:bg-gray-800/80 w-full">${
											issue.title
										}</code>
									</div>
									<div class="mt-2 pt-1">${expectedResult.replace(/`([^`]+)`/g, (match, code) => {
										const formattedCode = code
											.split("\n")
											.map((line) => line.trim())
											.join("\n");
										return `<code class="bg-gray-800 px-2 py-0.5 rounded text-blue-300 font-mono text-xs whitespace-pre-wrap leading-relaxed inline-block my-0.5 border border-gray-700 transition-all duration-200 hover:border-blue-500/30 hover:bg-gray-800/80">${formattedCode}</code>`;
									})}</div>
								</div>
							</li>
						`;
					})
					.join("");

				// After content is loaded, remove updating class and reset height
				requestAnimationFrame(() => {
					issuesList.classList.remove("updating");
					// Small delay to ensure opacity transition completes
					setTimeout(() => {
						issuesList.style.minHeight = "auto";
					}, 150);
				});
			}, 150);
		}

		// Initial render
		updateIssuesList();

		// Add clear filters function
		document
			.getElementById("clear-filters")
			.addEventListener("click", () => {
				activeFilters.clear();
				updateIssuesList();
			});

		// Add filter toggle function to window scope
		window.toggleFilter = function (labelName) {
			if (activeFilters.has(labelName)) {
				activeFilters.delete(labelName);
			} else {
				// Only allow one filter at a time
				activeFilters.clear();
				activeFilters.add(labelName);
			}

			const filteredIssues =
				activeFilters.size === 0
					? notCrashIssues
					: notCrashIssues.filter((issue) => {
							const issueLabels = new Set([issue.state]);
							return Array.from(activeFilters).every((filter) =>
								issueLabels.has(filter)
							);
					  });

			updateIssuesList(filteredIssues);
		};
	} catch (error) {
		console.error(error);
		document.getElementById("crash-issues").innerText =
			"Error fetching issues";
		document.getElementById("issues-list").innerHTML =
			"<li class='p-4'>Error loading issues</li>";
	}
}

fetchIssueCounts();
