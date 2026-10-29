// The 20 cases. run() looks for the answer on the PAGE (not in the array).
var CASES = [
  { q: 'Who is in the hall?',
    run: function () {
      return $('#hall .guest');
    } },
  { q: 'Who is dressed in yellow or purple?',
    run: function () {
      return $('[data-color=yellow], [data-color=purple]');
    } },
  { q: 'Which AITU students are upstairs?',
    run: function () {
      return $('#floor2 .guest.aitu');
    } },
  { q: 'Who has glasses or a bag?',
    run: function () {
      return $('.has-glasses, .has-bag');
    } },
  { q: 'Who came with nothing at all?',
    run: function () {
      return $('.guest[data-things=""]');
    } },
  { q: 'Who has a phone but no bag?',
    run: function () {
      return $('.has-phone:not(.has-bag)');
    } },
  { q: 'Who arrived between 20:30 and 21:00, both included?',
    run: function () {
      return $('.guest').filter(function () {
      var m = $(this).data('min');
      return m >= 1230 && m <= 1260;   // 20:30 = 1230 min, 21:00 = 1260 min
    });
    } },
  { q: 'Who arrived after 21:00 and is not an AITU student?',
    run: function () {
      return $('.guest').filter(function () { return $(this).data('min') > 1260; }).not('.aitu');
    } },
  { q: 'Who stands right next to Askar?',
    run: function () {
      return $('[data-name=Askar]').prev().add($('[data-name=Askar]').next());
    } },
  { q: 'Who stands last in each room?',
    run: function () {
      return $('.guest:last-child');
    } },
  { q: 'Who stands third in each room?',
    run: function () {
      return $('.guest:nth-child(3)');
    } },
  { q: 'Who stands after Timur in his room?',
    run: function () {
      return $('[data-name=Timur]').nextAll();
    } },
  { q: 'Who stands right before someone in black?',
    run: function () {
      return $('[data-color=black]').prev();
    } },
  { q: 'In which room is Aruzhan?',
    run: function () {
      return $('[data-name=Aruzhan]').closest('.room');
    } },
  { q: 'Which rooms have fewer than 6 guests?',
    run: function () {
      return $('.room').filter(function () { return $(this).find('.guest').length < 6; });
    } },
  { q: 'In which rooms has somebody a cup, but nobody wears glasses?',
    run: function () {
      return $('.room:has(.has-cup):not(:has(.has-glasses))');
    } },
  { q: 'Who came first to each room?',
    run: function () {
      return $('.room').map(function () {
      return $(this).find('.guest').get().sort(function (a, b) {
        return $(a).data('min') - $(b).data('min');
      })[0];
    });
    } },
  { q: 'Miras (AITU, blue, 21:20, phone) joins between Askar and Inkar',
    run: function () {
      return makeCard({ name: 'Miras', color: 'blue', time: '21:20', aitu: true, things: ['phone'] })
      .hide().insertAfter('[data-name=Askar]').fadeIn(800);
    } },
  { q: 'Natasha says goodbye and goes home',
    run: function () {
      return $('[data-name=Natasha]');
    },
    after: function (found) { found.fadeOut(800, function () { $(this).remove(); }); } },
  { q: 'Who took the cake?',
    run: function () {
      return $('#floor1 .guest')
      .filter(function () { var m = $(this).data('min'); return m > 1260 && m < 1290; })   // after 21:00, before 21:30
      .filter('.has-crumbs:not(.has-cup)')
      .filter(function () { return $(this).prev().add($(this).next()).filter('.aitu').length > 0; });
    } }
];
