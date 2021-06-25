"use strict";


/*****************************************************************************/
/** Log in. Called either by loginViaStoredCredentials or by submitting login form. */

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();
  const username = $("#login-username").val();
  const password = $("#login-password").val();
  //--------AWAIT--------
  Context.user = await User.login(username, password);
  if(Context.user) {
    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
  }
  Context.storyList.resolve();  //Here we make sure that hidden stories end up in the right container
  $loginForm.trigger("reset");
}
//--------SET HANDLER--------
$loginForm.on("submit", login);


/*****************************************************************************/
/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();
  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();
  //--------AWAIT--------
  Context.user = await User.signup(username, password, name);
  if(Context.user){
    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
  }
  $signupForm.trigger("reset");
}
//--------SET HANDLER--------
$signupForm.on("submit", signup);


/*****************************************************************************/
/** Logout, remove username and token but do not remove user profile data.*/

function logout(evt) {
  console.debug("logout", evt);
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  location.reload();
  $loginForm.show();
  $signupForm.show();
  Context.user.favorites.length = 0; //Remove all the favorites then update the UI
  updateFavorites();  //This will clear all the favorite indicators since we don't have a user.
  Context.user = null; //Prevent user-specific methods
}


/*****************************************************************************/
/** Change user profile data. Can really only modify user and password.*/

async function changeUserData(evt) {
  evt.preventDefault();
  console.debug("change user data", evt);
  if(!Context.user)return;
  let response = await User.editUser($("#change-password").val(), $("#change-name").val());
  console.debug(response.toString());
  //Now let's update local storage and update the UI.
  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();
}
//--------SET HANDLER--------
$changeForm.on("submit", changeUserData);


/*****************************************************************************/
/** Submit a story. */
/**
 * Submit a user-defined story.
 * Once the story is submitted we will rebuild the entire collection by retrieving
 * all stories just in case there have been recent submissions. 
 *  @returns 
 */

 async function onSubmitStory(evt) {
//  evt.preventDefault();
  if(Context.user == null)return;
  const $formStoryTitle = $("#add-story-title");
  const $formStoryURL = $("#add-story-url");
  const title = $formStoryTitle.val();
  const url = $formStoryURL.val();
  $formStoryTitle.empty();
  $formStoryURL.empty();
  console.debug(`Submitted the story ${title} @ ${url}`);
  let story = await StoryList.addStory({title: title, author:Context.user.name, url: url});
  $addStoryForm.trigger("reset");
  $addStoryForm.hide();
  if(story) {
    story.element = generateStoryMarkup(story);
    $allStoriesList.append(story.element);
  }
}
//--------SET HANDLER--------
$addStoryForm.on("submit", onSubmitStory);


/*****************************************************************************/

 /* Storing/recalling previously-logged-in-user with localStorage
 * If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = Context.readLocalStorage("token");
  const username = Context.readLocalStorage("username");
  if (!token || !username) return false;
  // try to log in with these credentials (will be null if login failed)
  Context.user = await User.loginViaStoredCredentials(token, username);
}


/*****************************************************************************/
/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (Context.user) {
    Context.writeLocalStorage("token", Context.user.loginToken);//   localStorage.setItem("token", JSON.stringify(Context.user.loginToken));
    Context.writeLocalStorage("username", Context.user.username);//   localStorage.setItem("username", JSON.stringify(Context.user.username));
  }
}


/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 * ---- HIDE THE LOGIN AND SIGNUP FORMS
 */

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");
  Context.user.mode = Context._lsRoot[Context.user.username] ? Context._lsRoot[Context.user.username].lastMode : "";
  $allStoriesList.show();
  $loginForm.hide();
  $signupForm.hide();
  $navAddStory.removeClass("hidden");
  $navShowHidden.removeClass("hidden");
  $navShowFavorites.removeClass("hidden");
  $navShowMine.removeClass("hidden");
  $navUserProfile.removeClass("hidden");
  updateFavorites();
  updateNavOnLogin();
  $(".story-controls").removeClass("hidden");
}
