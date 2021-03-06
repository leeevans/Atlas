define(['knockout', '../options', '../InputTypes/Range', '../InputTypes/Text', 'text!./ConditionOccurrenceTemplate.html', './ConceptSetSelector'
], function (ko, options, Range, Text, template) {

	function ConditionOccurrenceViewModel(params) {

		var self = this;
		self.expression = ko.utils.unwrapObservable(params.expression);
		self.Criteria = params.criteria.ConditionOccurrence;
		self.options = options;

		var addActions = [
			{
				text: "Add Condition Start Date Filter",
				selected: false,
				description: "Filter Condition Occurrences by the Condition Start Date.",
				action: function() {
					if (self.Criteria.OccurrenceStartDate() == null)
						self.Criteria.OccurrenceStartDate(new Range({Op: "lt"}));				
				}
			},
			{
				text: "Add Condition End Date Filter",
				selected: false,
				description: "Filter Condition Occurrences  by the Condition End Date",
				action: function() {
					if (self.Criteria.OccurrenceEndDate() == null)
						self.Criteria.OccurrenceEndDate(new Range({Op: "lt"}));				
				}
			},
			{
				text: "Add Condition Type Filter",
				selected: false,
				description: "Filter Condition Occurrences  by the Condition Type.",
				action: function() {
					if (self.Criteria.ConditionType() == null)
						self.Criteria.ConditionType(ko.observableArray());				
				}
			},
			{
				text: "Add Stop Reason Filter",
				selected: false,
				description: "Filter Condition Occurrences  by the Stop Reason.",
				action: function() {
					if (self.Criteria.StopReason() == null)
						self.Criteria.StopReason(new Text({Op: "contains"}));				
				}
			},
			{
				text: "Add Condition Source Concept Filter",
				selected: false,
				description: "Filter Condition Occurrences  by the Condition Source Concept.",
				action: function() {
					if (self.Criteria.ConditionSourceConcept() == null)
						self.Criteria.ConditionSourceConcept(ko.observable());				
				}
			},
			{
				text: "Add New Diagnosis Filter",
				selected: false,
				description: "Limit Condition Occurrences to new diagnosis.",
				action: function() {
					if (self.Criteria.First() == null)
						self.Criteria.First(true);				
				}
			},
			{
				text: "Add Age at Occurrence Filter",
				selected: false,
				description: "Filter Condition Occurrences by age at occurrence.",
				action: function() {
					if (self.Criteria.Age() == null)
						self.Criteria.Age(new Range());				
				}
			}, 
			{
				text: "Add Gender Filter",
				selected: false,
				description: "Filter Condition Occurrences based on Gender.",
				action: function() {
					if (self.Criteria.Gender() == null)
						self.Criteria.Gender(ko.observableArray());				
				}

			},
			{
				text: "Add Provider Specialty Filter",
				selected: false,
				description: "Filter Condition Occurrences based on provider specialty.",
				action: function() {
					if (self.Criteria.ProviderSpecialty() == null)
						self.Criteria.ProviderSpecialty(ko.observableArray());				
				}
			},
			{
				text: "Add Visit Filter",
				selected: false,
				description: "Filter Condition Occurrences based on visit occurrence of diagnosis.",
				action: function() {
					if (self.Criteria.VisitType() == null)
						self.Criteria.VisitType(ko.observableArray());				
				}
			}
		];

		self.addCriterionSettings = {
			selectText: "Add Filter...",
			height:300,
			actionOptions: addActions,
			onAction: function (data) {
				data.selectedData.action();
			}
		};

		self.removeCriterion = function (propertyName) {
			self.Criteria[propertyName](null);
		}
		
	}

	// return compoonent definition
	return {
		viewModel: ConditionOccurrenceViewModel,
		template: template
	};
});