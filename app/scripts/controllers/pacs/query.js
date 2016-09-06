'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:PacsQueryCtrl
 * @description
 * # PacsQueryCtrl
 * Controller of the minovateApp
 */
app
  .controller('PacsQueryCtrl', function ($scope, NgTableParams) {
     $scope.page = {
      title: 'Pacs Query',
      subtitle: ''
    };

    var data = [
      {
        patientName: "Anonymous",
        studyDescription: "FORFILE CD PET SCAN",
        studyDate: new Date(),
        modality: "MR",
      },
      {
        patientName: "Ami Letze",
        studyDescription: "Uruguay",
        studyDate: new Date(),
        modality: "MR",
      },
      {
        patientName: "Luther Mincey",
        studyDescription: "Libya",
        studyDate: new Date(),
        modality: "MR",
      },
      {
        patientName: "Raye Bradick",
        studyDescription: "Lithuania",
        studyDate: new Date(),
        modality: "MR",
      },
      {
        patientName: "Meghan Odwyer",
        studyDescription: "Serbia",
        studyDate: new Date(),
        modality: "MR",
      },
      {
        patientName: "Herb Pachlin",
        studyDescription: "Mongolia",
        studyDate: new Date(),
        modality: "MR",
      },
      {
        patientName: "Drema Sprau",
        studyDescription: "Dominican Republic",
        studyDate: new Date(),
        modality: "MR",
      },
      {
        patientName: "Jules Vaccaro",
        studyDescription: "Samoa",
        studyDate: new Date(),
        modality: "MR",
      },
      {
        patientName: "Albina Haaker",
        studyDescription: "Italy",
        studyDate: new Date(),
        modality: "MR",
      },
      {
        patientName: "Alla Greengo",
        studyDescription: "Thailand",
        studyDate: new Date(),
        modality: "MR",
      },
      {
        patientName: "Melodi Kersten",
        studyDescription: "Nigeria",
        studyDate: new Date(),
        modality: "MR",
      },
    ]

    $scope.test = new NgTableParams({
      page: 1,
      count: 10
    }, { 
      dataset: data,
      counts: [5, 10, 20]
    });

  });
