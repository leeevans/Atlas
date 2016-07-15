define(['jquery', 'knockout', 'text!./cohort-comparison-manager.html', 'webapi/CohortDefinitionAPI', 'appConfig', 'cohortcomparison/ComparativeCohortAnalysis', 'nvd3', 'css!./styles/nv.d3.min.css'],
	function ($, ko, view, cohortDefinitionAPI, config, ComparativeCohortAnalysis) {
		function cohortComparisonManager(params) {
			var self = this;
			self.config = config;
			self.loading = ko.observable(true);
			self.executions = ko.observableArray();
			self.covariates = ko.observableArray();
			self.currentExecutionId = ko.observable();
			self.currentExecutionAuc = ko.observable();
			self.matchedpopdist = ko.observableArray();
			self.psmodeldist = ko.observableArray();
			self.attrition = ko.observableArray();

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
						var executed = new Date(d.executed);

						return executed.toLocaleDateString() + ' ' + executed.toLocaleTimeString();
					}
			},
				{
					title: 'Duration',
					data: 'duration'
			}
		];

			self.executionOptions = {
				lengthMenu: [[5, -1], ['5', 'All']],
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
				lengthMenu: [[10, -1], ['10', 'All']],
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

			self.tabMode = ko.observable('specification');
			self.pillMode = ko.observable('covariates');

			self.pillMode.subscribe(function (d) {
				window.setTimeout(function (d) {
					window.dispatchEvent(new Event('resize'));
				}, 1);
			})

			self.cohortComparisonId = params.currentCohortComparisonId;

			self.covariateSelected = function (d) {
				console.log(d);
			}

			self.executionSelected = function (d) {
				$.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.id + '/psmodel',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						self.currentExecutionId(d.id);
						self.currentExecutionAuc(response.auc);
						self.covariates(response.covariates);
					}
				});

				$.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.id + '/attrition',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						self.attrition(response);
					}
				});

				$.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.id + '/balance',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						nv.addGraph(function () {

							var points = response.map(d => ({
								x: Math.abs(d.beforeMatchingStdDiff),
								y: Math.abs(d.afterMatchingStdDiff),
								tooltip: d.covariateName
							}));
							var data = [{
								key: 'Covariates',
								values: points
							}];

							var balanceChart = nv.models.scatterChart()
								.forceY([0, 2])
								.forceX([0, 2])
								.showDistX(true)
								.showDistY(true)
								.color(d3.scale.category10().range());

							balanceChart.tooltip.contentGenerator(function (d) {
								return '<div class="scatterTooltip"><div>' + d.point.tooltip + '</div><div>Before Matching: ' + d.point.x + '</div><div>After Matching: ' + d.point.y + '</div></div>';
							});

							//Axis settings
							balanceChart.xAxis.tickFormat(d3.format('.02f'));
							balanceChart.yAxis.tickFormat(d3.format('.02f'));

							d3.select('#balanceChart svg')
								.datum(data)
								.call(balanceChart);

							nv.utils.windowResize(balanceChart.update);

							return balanceChart;
						});
					}
				});

				$.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.id + '/matchedpopdist',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						self.matchedpopdist(response);

						var data = [
							{
								values: response.map(d => ({
									'x': d.ps,
									'y': d.comparator
								})).sort(function (a, b) {
									return a.x - b.x
								}),
								key: 'Comparator',
								color: '#000088',
								area: true
							},
							{
								values: response.map(d => ({
									'x': d.ps,
									'y': d.treatment
								})).sort(function (a, b) {
									return a.x - b.x
								}),
								key: 'Treatment',
								color: '#880000',
								area: true
							}
						];

						nv.addGraph(function () {
							var matchedChart = nv.models.lineChart()
								.useInteractiveGuideline(true)
								.interpolate("basis");

							matchedChart.duration(0);

							d3.select("#matchedpopdistChart svg")
								.datum(data)
								.call(matchedChart);

							nv.utils.windowResize(matchedChart.update);
							return matchedChart;
						});
					}
				});

				$.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.id + '/psmodeldist',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						var comparatorMax = d3.max(response, d => d.comparator);
						var treatmentMax = d3.max(response, d => d.treatment);

						var data = [
							{
								values: response.map(d => ({
									'x': d.ps,
									'y': d.comparator / comparatorMax
								})).sort(function (a, b) {
									return a.x - b.x
								}),
								key: 'Comparator',
								color: '#000088',
								area: true
							},
							{
								values: response.map(d => ({
									'x': d.ps,
									'y': d.treatment / treatmentMax
								})).sort(function (a, b) {
									return a.x - b.x
								}),
								key: 'Treatment',
								color: '#880000',
								area: true
							}
						];


						nv.addGraph(function () {
							var modelChart = nv.models.lineChart()
								.useInteractiveGuideline(true)
								.interpolate("basis");

							modelChart.duration(0);

							d3.select("#psmodeldistChart svg")
								.datum(data)
								.call(modelChart);

							nv.utils.windowResize(modelChart.update);
							return modelChart;
						});
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

			self.close = function () {

			}

			self.conceptsetSelected = function (d) {
				self.cohortComparison().exclusionId(d.id);
				self.cohortComparison().exclusionCaption(d.name);
				$('cohort-comparison-manager #modalConceptSet').modal('hide');
			}

			self.chooseTreatment = function () {
				$('cohort-comparison-manager #modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().treatmentId;
				self.targetCaption = self.cohortComparison().treatmentCaption;
			}

			self.chooseComparator = function () {
				$('cohort-comparison-manager #modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().comparatorId;
				self.targetCaption = self.cohortComparison().comparatorCaption;
			}

			self.chooseOutcome = function () {
				$('cohort-comparison-manager #modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().outcomeId;
				self.targetCaption = self.cohortComparison().outcomeCaption;
			}

			self.chooseExclusion = function () {
				$('cohort-comparison-manager #modalConceptSet').modal('show');
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