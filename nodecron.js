const axios = require('axios');
const firebase = require('firebase-admin');
const serviceAccount = require('./service-account');
const _ = require('lodash');


firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://facebook-event-aggregator.firebaseio.com'
});



firebase.database().ref('/schools/UCF').on('value', async snapshot => {
  const pages = snapshot.val() || [];
  let accessToken = process.env.FB_ACCESS_TOKEN
  // console.log('got pages', pages);
  const events = pages.map(async page => {
    const response = await axios.get(
      `https://graph.facebook.com/v2.10/${page.id}/events?time_filter=upcoming&fields=fields=can_viewer_post,cover,description,end_time,is_canceled,attending_count,id,name,is_page_owned,owner,start_time,interested_count,maybe_count,timezone,place,updated_time`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const pageEvents = response.data.data;
      // console.log(pageEvents)
  })
  console.log(events);
  await firebase.database().ref('/events/UCF').push(events);

  console.log('done')
})


