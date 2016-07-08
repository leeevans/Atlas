define(['knockout', 'text!./cohort-comparison-manager.html', 'webapi/CohortDefinitionAPI', 'appConfig', 'cohortcomparison/ComparativeCohortAnalysis'], function (ko, view, cohortDefinitionAPI, config, ComparativeCohortAnalysis) {
	function cohortComparisonManager(params) {
		var self = this;
		self.config = config;
		self.loading = ko.observable(true);
		self.executions = ko.observableArray();
		self.covariates = ko.observableArray();
		
		self.executionColumns = [
			{
				title: 'Id',
				data: 'id'
			},
			{
				title: 'Status',
				data: 'executionStatus'
			},
			{
				title: 'Source',
				data: 'sourceKey'
			},
			{
				title: 'Started',
				render: function (s, p, d) {
					return new Date(d.executed).toLocaleDateString();
				}
			},
			{
				title: 'Duration',
				data: 'duration'
			}
		];		
		
		self.executionOptions = {
			Facets: [
				{
					'caption': 'Started',
					'binding': function (o) {
						var daysSinceModification = (new Date().getTime() - new Date(o.executed).getTime()) / 1000 / 60 / 60 / 24;
						if (daysSinceModification < 7) {
							return 'This Week';
						} else if (daysSinceModification < 14) {
							return 'Last Week';
						} else {
							return '2+ Weeks Ago';
						}
					}
				},
				{
					'caption': 'Status',
					'binding': function (o) {
						return o.executionStatus;
					}
				}
			]
		};		
		
		self.covariateColumns = [
			{
				title: 'Id',
				data: 'id'
			},
			{
				title: 'Name',
				data: 'name'
			},
			{
				title: 'Value',
				data: 'value'
			}
		];		
		
		self.covariateOptions = {
			Facets: [
				{
					'caption': 'Value',
					'binding': function (o) {
						if (o.value > 2) {
							return '> 2';
						} else if (o.value < -2) {
							return '< -2';
						} else {
							return 'Other';
						}
					}
				}
			]
		};			
		
		self.tabMode = ko.observable('overview');
		self.cohortComparisonId = params.currentCohortComparisonId;
		
		self.covariateSelected = function(d) {
			console.log(d);
		}
		
		self.executionSelected = function(d) {
			$.ajax({
				url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.id + '/psmodel',
				method: 'GET',
				contentType: 'application/json',
				success: function (response) {
					self.covariates(response.covariates);
				}
			});	
		}
		
		self.cohortSelected = function (id) {
			$('cohort-comparison-manager #modalCohortDefinition').modal('hide');
			cohortDefinitionAPI.getCohortDefinition(id).then(function (cohort) {
				self.targetId(cohort.id);
				self.targetCaption(cohort.name);
			});
		}

		self.canSave = ko.pureComputed(function () {
			return self.cohortComparison().comparatorId() && self.cohortComparison().treatmentId() && self.cohortComparison().exclusionId() && self.cohortComparison().outcomeId();
		});

		self.save = function () {
			
			var cca = {
				name: self.cohortComparison().name(),
				treatmentId: self.cohortComparison().treatmentId(),
				comparatorId: self.cohortComparison().comparatorId(),
				outcomeId: self.cohortComparison().outcomeId(),
				timeAtRisk: 9999,
				exclusionId: self.cohortComparison().exclusionId()
			};

			if (self.cohortComparisonId() != 0) {
				cca.id = self.cohortComparisonId();
			}
			
			var json = JSON.stringify(cca);

			var savePromise = $.ajax({
				method: 'POST',
				url: config.services[0].url + 'comparativecohortanalysis/',
				contentType: 'application/json',
				data: json,
				dataType: 'json',
				success: function (data) {}
			});

			savePromise.then(function (saveResult) {
				console.log(saveResult);
			});
		}

		self.close = function () {}

		self.conceptsetSelected = function (id) {
			console.log(id);
		}

		self.chooseTreatment = function() {
			$('cohort-comparison-manager #modalCohortDefinition').modal('show');			
			self.targetId = self.cohortComparison().treatmentId;
			self.targetCaption = self.cohortComparison().treatmentCaption;
		}
		
		self.chooseComparator = function() {
			$('cohort-comparison-manager #modalCohortDefinition').modal('show');			
			self.targetId = self.cohortComparison().comparatorId;
			self.targetCaption = self.cohortComparison().comparatorCaption;
		}
		
		self.chooseOutcome = function() {
			$('cohort-comparison-manager #modalCohortDefinition').modal('show');			
			self.targetId = self.cohortComparison().outcomeId;
			self.targetCaption = self.cohortComparison().outcomeCaption;
		}
		
		self.chooseExclusion = function() {
			$('cohort-comparison-manager #modalConceptSet').modal('show');			
			self.targetId = self.cohortComparison().exclusionId;
			self.targetCaption = self.cohortComparison().exclusionCaption;
		}		

		self.chooseConceptSet = function (conceptSetType, observable) {
			self.targetObservable = observable;
			$('cohort-comparison-manager #modalConceptSet').modal('show');
		}

		self.executeCohortComparison = function () {
			var generatePromise = $.ajax({
				url: config.services[0].url + 'comparativecohortanalysis/' + self.cohortComparisonId() + '/execute/' + 'OPTUM-PDW',
				method: 'GET',
				contentType: 'application/json',
				success: function (c, status, xhr) {
					console.log(c);
				}
			});
		};

		if (self.cohortComparisonId() == 0) {
			self.cohortComparison = ko.observable(new ComparativeCohortAnalysis());
			self.loading(false);
		} else {
			$.ajax({
				url: config.services[0].url + 'comparativecohortanalysis/' + self.cohortComparisonId(),
				method: 'GET',
				contentType: 'application/json',
				success: function (comparativeCohortAnalysis) {
					self.cohortComparison = ko.observable(new ComparativeCohortAnalysis(comparativeCohortAnalysis));
					self.loading(false);
				}
			});
			
			$.ajax({
				url: config.services[0].url + 'comparativecohortanalysis/' + self.cohortComparisonId() + '/executions',
				method: 'GET',
				contentType: 'application/json',
				success: function (response) {
					self.executions(response);
				}
			});			
		}
	}

	var component = {
		viewModel: cohortComparisonManager,
		template: view
	};

	ko.components.register('cohort-comparison-manager', component);
	return component;
});