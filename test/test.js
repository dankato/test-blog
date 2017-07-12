// Integration testing for the Posts app
'use strict';

// requires
const faker = require('faker');
const mongoose = require('mongoose');
const mocha = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { BlogPost } = require('../models');
const { TEST_DATABASE_URL } = require('../config');
const { app, runServer, closeServer } = require('../server');
const should = chai.should();
chai.use(chaiHttp);


// Test set up and tear down

// put fake data in the database
function seedPostsData() {
  console.log('seed working');

  const seedData = [];
  for (var i = 1; i <= 10; i++) {
    seedData.push(generatePostData());
  }
  return BlogPost.insertMany(seedData);
}

// console.log(seedPostsData());

// generating fake data here using faker.js
function generatePostData() {
  return {
    title: faker.lorem.words(),
    content: faker.lorem.paragraph(),
    author: { firstName: faker.name.firstName(), lastName: faker.name.lastName() },
    created: faker.date.past(),
  };
}
// console.log(generatePostData());

// deletes entire
function tearDown() {
  console.warn('yo, you deleted a database');
  return mongoose.connection.dropDatabase();
}

// each of these hook functions need to return a promise, the value returned by these function calls.
describe('Posts API resource', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedPostsData();
  });

  afterEach(function() {
    return tearDown();
  });

  after(function() {
    return closeServer();
  });

// Testing GET requests
  describe('GET endpoint', function() {
    it('should return all existing posts', function() {
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
        // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
        // otherwise our db seeding didn't work
          res.body.posts.length.should.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          res.body.posts.should.have.lengthOf(count);
        });
    });

    it('should return posts with right fields', function() {
      // Strategy: Get back all posts, and ensure they have expected keys

      let resPosts;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.posts.should.be.an('array');
          //res.body.posts.should.have.length.of.at.least(1);


          res.body.posts.length.should.at.least(1);
          res.body.posts.forEach(function(post) {
            post.should.be.an('object');
            post.should.include.keys(
              'id', 'title', 'content', 'author', 'created');
          });
          resPosts = res.body.posts[0];
          return BlogPost.findById(resPosts.id);
        })
        .then(function(post) {
          console.log(post);
          resPosts.id.should.equal(post.id);
          resPosts.title.should.equal(post.title);
          resPosts.content.should.equal(post.content);
        //   resPosts.author.should.equal(post.author);
        //   resPosts.created.should.contain(post.created);
        });
    });
  });
}); 