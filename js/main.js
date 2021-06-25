"use strict";

//The base url
const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

// So we don't have to keep re-finding things on page, find DOM elements once:
const $body = $("body");

const $storiesLoadingMsg = $("#stories-loading-msg");

//Here are the 4 views available for viewing stories
const $allStoriesList = $("#all-stories-list");
const $hiddenStoriesList = $("#hidden-stories-list");
const $favoriteStoriesList = $("#favorite-stories-list");
const $myStoriesList = $("#my-stories-list");

const $loginForm = $("#login-form");
const $signupForm = $("#signup-form");
const $changeForm = $("#change-form");
const $addStoryForm = $("#add-story-form");
const $addStorySubmit = $("#add-story-submit");

const $navLogin = $("#nav-login");
const $navUserProfile = $("#nav-user-profile");
const $navLogOut = $("#nav-logout");
const $navSubmitStory = $("#nav-submit-story");
const $navAddStory = $("#nav-add-story");
const $navShowHidden = $("#nav-show-hidden");
const $navShowFavorites = $("#nav-show-favorites");
const $navShowMine = $("#nav-show-mine");


/** To make it easier for individual components to show just themselves, this
 * is a useful function that hides pretty much everything on the page. After
 * calling this, individual components can re-show just what they want.
 */

function hidePageComponents() {
  const components = [
    $allStoriesList,
    $hiddenStoriesList,
    $favoriteStoriesList,
    $myStoriesList,
    $loginForm,
    $signupForm,
    $changeForm,
    $addStoryForm
  ];
  components.forEach(c => c.hide());
}

function getActiveContextView() {
  switch(Context.mode) {
    case "favorites" : return $favoriteStoriesList; break;
    case "hidden" : return $hiddenStoriesList; break;
    case "mine" : return $myStoriesList; break;
    default: return $allStoriesList;
  }
}

/** Overall function to kick off the app. */

async function start() {
  console.debug("start");

  // "Remember logged-in user" and log in, if credentials in localStorage
  await checkForRememberedUser();
  await getAndShowStoriesOnStart();
  // If we got a logged-in user.
  if (Context.user) updateUIOnUserLogin();
}

// Once the DOM is entirely loaded, begin the app

console.warn("HEY STUDENT: This program sends many debug messages to" +
  " the console. If you don't see the message 'start' below this, you're not" +
  " seeing those helpful debug messages. In your browser console, click on" +
  " menu 'Default Levels' and add Verbose");
$(() => {
  //Sometimes - but not always - jQuery throws a jQuery.Deffered exception and ReferenceError on one class or another.
  //We'll just keep looping until all are available.
  while((User == 'undefined') || (Story == 'undefined') || (StoryList == 'undefined') || (Context =='undefined')){setTimeout(()=>{}, 10)}
  start();
});
