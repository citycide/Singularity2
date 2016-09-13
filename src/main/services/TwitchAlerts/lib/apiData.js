export default {
  names: {
    v1: {
      donations: 'donations',
      donationGoal: 'donationGoal'
    }
  },

  API: {
    v1: {
      base: 'http://www.twitchalerts.com/api/',
      endpoints: [
        {
          name: 'donations',
          auth: {
            required: true,
            qs: 'access_token'
          },
          method: 'GET',
          path: 'donations',
          contentType: '*/*',
          queryOptions: []
        },
        {
          name: 'donationGoal',
          auth: {
            required: true,
            qs: 'token'
          },
          method: 'GET',
          path: '../widgets/donation-goal',
          contentType: 'json',
          queryOptions: [
            {
              name: 'filemtime',
              defaultValue: 1,
              type: 'number',
              required: true
            },
            {
              name: 'hash',
              defaultValue: '',
              type: 'string',
              required: false
            }
          ]
        }
      ]
    }
  }
}
