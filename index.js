// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

process.env.DEBUG = 'actions-on-google:*';
const Assistant = require('actions-on-google').ApiAiAssistant;
const request = require('request');
const https = require('https');
const CITY = 'geo-city';
const STATE = 'state';
const EXPERTISE = 'Expertise';
const NUM_MORE_RESULTS = 'number';
const BUSINESS = 'expertise-business';
const BUSINESS_DETAILS = 'businessDetails';  // Should be phone, email, or both

let parsedData;  // This is the data from the 'available expertises' api call
let results;  // This is the array of the expertises from parsedData
let parsedFinalData;  // This is the data from the expertise api call
let finalBusinessNames;  // This is an array of all the business names from parsedFinalData
let numberOfFinalResults;  // This is the length of the finalBusinessNames array;
let numberResultsListed = 0;  // This is to keep track of how many results we've given out
let initialResultsListed = 3;  // The initial number of results to read back to the customer
let resultsRead = [];
let details;
let businessForDetails;

// [START YourAction]
exports.expertiseAssistant = (req, res) => {
  const assistant = new Assistant({request: req, response: res});
  console.log('Payload: ', req.body);
  console.log('FINALBUSINESSNAMES: ', finalBusinessNames);
  console.log('parsedFinalData: ', parsedFinalData);

  function responseHandler (assistant) {
  // Complete your fulfillment logic and send a response
    // Need to get permission to get the device location
    // let deviceLocation = assistant.getDeviceLocation().city;
    // let city1 = deviceLocation.city

    // Can get device location from the assistant, then should be able to pull off state and city based on google API's
    let city = assistant.getArgument(CITY).toLowerCase();
    let state = assistant.getArgument(STATE).toLowerCase();
    let expertise = assistant.getArgument(EXPERTISE).toLowerCase();

    let availableOptions = {
     hostname: 'www.expertise.com',
     path: `/api/v1.0/available-dirs/${state}/${city}`,
     method: 'GET',
     headers: {
       'Content-Type': 'application/json'
     }
    };

    let options = {
     hostname: 'www.expertise.com',
     path: `/api/v1.0/directories/${state}/${city}/${expertise}`,
     method: 'GET',
     headers: {
       'Content-Type': 'application/json'
     }
    };

    https.get(availableOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => data += chunk);

      res.on('end', () => {
        try {
          parsedData = JSON.parse(data);
          results = parsedData.map((expertise) => {
            return expertise.vert_slug;
          });
          if(results.indexOf(expertise) !== -1) {
            https.get(options, (res) => {
              let finalData = '';

              res.on('data', (chunk) => finalData += chunk);

              res.on('end', () => {
                try {
                  parsedFinalData = [];
                  parsedFinalData = JSON.parse(finalData);
                  finalBusinessNames = parsedFinalData.providers.map((provider) => {
                    return provider.business_name.toLowerCase();
                  });
                  let i = 0;
                  resultsRead = [];
                  for (i; i < initialResultsListed; i++) {
                    resultsRead.push(finalBusinessNames[i]);
                    numberResultsListed++;
                  }
                  let numberOfFinalResults = finalBusinessNames.length;
                  assistant.ask(`I found ${numberOfFinalResults} results for ${expertise} in ${city}, ${state}.  The first ${initialResultsListed} are ${resultsRead}.
                  Would you like the phone number and website for any of these results, or would you like to hear some more options?`);
                } catch (e) {
                  console.log("Error on inner get: ", e);
                }
              }).on('error', (e) => {
                console.log('On Error: ', e);
              });
            });
          } else {
            let requestedExpertiseLength = expertise.length;
            let i = 0;
            let test = '';
            // Grab the first part of the requested expertise.
            for (i; i < requestedExpertiseLength/2; i++) {
              test += expertise[i];
            }
            let regex = new RegExp(test);
            // Compare the requested expertise to what's available and see if there are any close matches that are available.
            let suggestedExpertise = results.filter(result => regex.test(result));
            if (suggestedExpertise.length !== 0) {
              assistant.tell(`It looks like we don't have a match for ${expertise} in ${city}, but here are a few expertises that are similar
              ${suggestedExpertise}`);
            } else {
              assistant.ask(`Sorry, but it looks like we don't have any information available for ${expertise}.  Is there something else I can help you find?`);
            }
          }
        } catch (e) {
          console.log('Error: ', e);
        }
      }).on('error', (e) => {
        console.log('Got some Error: ', e);
      });
    });
  }

  function moreResults (assistant) {
    let number = parseInt(assistant.getArgument(NUM_MORE_RESULTS));
    let moreResults = [];
    let startingPoint = numberResultsListed;
    let i = startingPoint;
    let totalNumberResults = parseInt(startingPoint + number);  // This isn't necessary, but just to make sure it stays an integer

    for(i; i < totalNumberResults; i++ ) {
      moreResults.push(finalBusinessNames[i]);
      resultsRead.push(finalBusinessNames[i]);
      numberResultsListed++;
    }

    assistant.ask(`Here are the results you asked for.  ${moreResults}.  Would you like details on any of these options or would you like to hear more results?`);
  }

  function businessDetails (assistant) {
    businessForDetails = assistant.getArgument(BUSINESS).toLowerCase();
    details = assistant.getArgument(BUSINESS_DETAILS);
    if (!businessForDetails) assistant.ask(`I'm sorry, I didn't get that.  Can you repeat the business please.`);
    console.log('Data: ', businessForDetails, ' ', details);
    console.log('FinalBusinessNamesArray: ', finalBusinessNames);
    let index = finalBusinessNames.indexOf(businessForDetails);
    let phone = '';
    let website = '';
    let business;
    console.log('Index: ', index);
    if (index !== -1) {
      business = parsedFinalData.providers[index];
    }
    console.log('Business: ', business);
    if (details === 'both') {
      phone = business.phone;
      website = business.website;
      // reset the data
      assistant.tell(`Great.  The phone number for ${businessForDetails} is ${phone} and the website is ${website}.  Have a great day!`);
      //let parsedData = null;
      //let finalBusinessNames = null;
      //let parsedFinalData = null;
      //let results = null;
      //let resultsRead = null;
      //let numberOfFinalResults = null;
      //let businessForDetails = null;
    } else if (details === 'phone') {
      phone = business.phone;
      // reset the data
      assistant.tell(`Great.  The phone number for ${businessForDetails} is ${phone}.  Have a great day!`);
      // let parsedData = null;
      // let finalBusinessNames = null;
      // let parsedFinalData = null;
      // let results = null;
      // let resultsRead = null;
      // let numberOfFinalResults = null;
      // let businessForDetails = null;
    } else {
      website = business.website;
      // reset the data
      assistant.tell(`Great.  The website for ${businessForDetails} is ${website}.  Have a great day!`);
      // let parsedData = null;
      // let finalBusinessNames = null;
      // let parsedFinalData = null;
      // let results = null;
      // let resultsRead = null;
      // let numberOfFinalResults = null;
      // let businessForDetails = null;
    }
  }

  // Fulfill action business logic
  const actionMap = new Map();
  actionMap.set('expertiseAssistant', responseHandler);
  actionMap.set('expertiseMoreResults', moreResults);
  actionMap.set('expertiseBusinessDetails', businessDetails);

  // This was initially called down here, but I moved it to the
  // http.request response.  Still don't work...
  assistant.handleRequest(actionMap);
};
// [END YoumorrAction]
