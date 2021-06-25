"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  top.location.reload();  //Let's just go through the whole load process again
  if(Context.user)User.mode = "";
  else Context.mode = "";
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}


$navLogin.on("click", navLoginClick);
$navLogOut.on("click", logout);
//We like having the add story form appear above the stories without hiding them
$navAddStory.on("click", () => $addStoryForm.show());

$navUserProfile.on("click", () => {
  hidePageComponents();
  $changeForm.show();
});

//We'll want to switch context to "user" and show all the user stuff.
//We'll also show our own hidden stuff but have it be highlighted
$navShowMine.on("click", () => {
  User.mode = "mine";
});

//We'll want to switch context to "favorites" and show only the favorites.
//We'll also show hidden favorites but have it highlighted.
$navShowFavorites.on("click", () => {
  User.mode = "favorites";

});

//We'll want to switch context to "hidden" and show only hidden items.
$navShowHidden.on("click", () => {
  User.mode = ("hidden");
});

/** When a user first logins in, update the navbar to reflect that. */
function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${Context.user.username}`).show();
}

