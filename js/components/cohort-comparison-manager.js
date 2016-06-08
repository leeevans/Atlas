define(['knockout', 'text!./cohort-comparison-manager.html', 'appConfig'], function (ko, view, config) {
	function cohortComparisonManager(params) {
		var self = this;
		self.config = config;
		self.loading = ko.observable(false);
		self.tabMode = ko.observable('overview');
		self.cohortComparison = ko.observable();

		var cc = {
			name: ko.observable('sample cohort comparison'),
			treatment: ko.observable(1),
			comparator: ko.observable(2),
			outcome: ko.observable(3),
			exclusions: ko.observable(1),
			timeAtRisk: ko.observable(9999)
		};

		self.cohortComparison(cc);

		self.generateCohortComparison = function () {
			var request = {
				treatment: self.cohortComparison().treatment(),
				comparator: self.cohortComparison().comparator(),
				outcome: self.cohortComparison().outcome(),
				exclusions: self.cohortComparison().exclusions(),
				timeAtRisk: self.cohortComparison().timeAtRisk(),
				sourceKey: 'OPTUM-PDW'
			};

			var generatePromise = $.ajax({
				url: config.services[0].url + 'rsb/cohortcomparison',
				data: JSON.stringify(request),
				method: 'POST',
				contentType: 'application/json',
				success: function (c, status, xhr) {}
			});
		};
	}

	var component = {
		viewModel: cohortComparisonManager,
		template: view
	};

	ko.components.register('cohort-comparison-manager', component);
	return component;
});