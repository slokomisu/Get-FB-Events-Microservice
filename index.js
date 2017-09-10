const axios = require('axios');
const firebase = require('firebase-admin');
const serviceAccount = require('./service-account');
const _ = require('lodash');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://facebook-event-aggregator.firebaseio.com'
});


firebase.database().ref('/pages').on('value', snapshot => {
  const results = snapshot.val() || {};
  if (!_.isEmpty(results)) {
    Object.keys(results).forEach(uid => {
      const userEvents = results[uid];
      const eventObjs = Object.values(userEvents).map(event => event.pageName)
      results[uid] = eventObjs
    })
    Object.keys(results).forEach(async uid => {
      const events = await getEventsForUser(results[uid]);
      await firebase.database().ref(`/events/${uid}`).set(events);
    })
  }

})

firebase.database().ref('/pages').on('child_removed', async snapshot => {
  const deletedChild = snapshot.val() || {};
  const uid = Object.values(deletedChild)[0].user;
  await firebase.database().ref(`/events/${uid}`).remove();
})

async function getEventsForUser(pages) {
  let accessToken = process.env.FB_ACCESS_TOKEN
  const requests = pages.map(pageId => {
    return axios.get(
      `https://graph.facebook.com/v2.10/${pageId}/events?time_filter=upcoming&fields=fields=can_viewer_post,cover,description,end_time,is_canceled,attending_count,id,name,is_page_owned,owner,start_time,interested_count,maybe_count,timezone,place,updated_time`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
  });
  return Promise.all(requests)
  .then(results => {
    return Promise.resolve(_.flatten(results.map(result => result.data.data)))
  })
  .catch(err => console.error(err))
}

