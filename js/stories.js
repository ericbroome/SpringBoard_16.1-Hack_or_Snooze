"use strict";

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  Context.storyList = await StoryList.getStories();
  if(Context.user)Context.user.readLocalStorage();  //This resolves the hidden stories
  $storiesLoadingMsg.remove();
  putStoriesOnPage();
  User.mode = "";
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story.
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  console.debug("generateStoryMarkup", story);
  const hostName = story.getHostName();
  const isMine = Context.user ? (Context.user.username == story.username ? true : false) : false;
  const flags = `${isMine ? " flag-is-mine " : ""}${story.isFavorite ? " flag-is-favorite " : ""}${story.isHidden ? " flag-is-hidden " : ""}`;
  const favorite = `favorite ${story.isFavorite ? "" : "not"}`;
  const hidden = `${story.isHidden ? (isMine && Context.mode == "mine" ?  "delete" : "restore") : "hide"}`;
  let el = $(`
      <li id="${story.storyId}" ${flags}>
        <span class="story-controls ${Context.user ? "" : "hidden"}">
          <a href="#" class="${favorite}" title="Favorite?">&#9733;</a>
          <a href="#" class="hide ${hidden}" title="Hide or delete story?">&cross;</a>
        </span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `).get()[0];
    //Make each html story entry and it's related Story instance cross-reference
    story.element = el;  //We'll store the POJO rather than the jQuery
    story.element['storyObject'] = story;  //Cross-reference
    return el;
}

/** Given a list of stories from server, generates their HTML, and puts on page. 
 * We'll also go through the favorites and make sure to handle those as well. 
 * We should only do this when loading a batch from the server.
*/

function putStoriesOnPage() {
  let user = Context.user;
  console.debug("putStoriesOnPage");
  $allStoriesList.empty();
  $hiddenStoriesList.empty();
  $favoriteStoriesList.empty();
  $myStoriesList.empty();
  // loop through all of our stories and generate HTML for them
  for (let story of Context.storyList.stories) {
    const $el = generateStoryMarkup(story);
    $allStoriesList.append($el);
    if(user) {
      user.hiddenStories.forEach(item => {
        if(item.storyId == story.storyId) {
          $hiddenStoriesList.append($el);
        }
      })
      user.ownStories.forEach(item => {
        if(item.storyId == story.storyId) {
          item.element = story.element;
          item.isMine = true;
        }
      })
    }
  }
  $allStoriesList.show();
  updateFavorites();
//  Context.storyList.resolve();
}

/**
 * Get the list of favorites from the user object and update the UI
 */
function updateFavorites(){
  if(Context.user == null)return;
  let $target = getActiveContextView();
  $target.find("a.favorite").addClass("not");  
  //The favorites are Story object instances
  $(Context.user.favorites).each((index, story) => {
    let $el = $target.find(`li#${story.storyId}`);
    if(!$el)return;
    story.element = $el.get()[0];
    story.isFavorite = true;
    $(story.element).find("a.favorite").removeClass("not");
  });
}


/** When we click any stories list or any of it's items we can figure out if it is a delete or favorite button
 * and act accordingly. Another option would be to add the story id to the <a> elements but most will never be clicked anyway.
 */
function storiesClicked(event) {
  event.preventDefault();
  let $el = $(event.target);
  if($el.is("a.favorite")) {
    let story = StoryList.getStoryById($el.closest("li").attr("id"));
    if(story.length > 0)story = User.favorite(story[0]);
  }
  else if($el.is("a.hide")) {
     let story = StoryList.getStoryById($el.closest("li").attr("id"));
    if(story.length > 0)User.deleteStory(story[0]);
  }
}
//Let's make sure that any context gets this message ("" (all stories), "favorites", "hidden", "mine")
$("ol").click(storiesClicked);
