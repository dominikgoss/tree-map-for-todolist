(function (global) {

  'use strict';

  var wunderlistSDK;
  var $lists, $tasks, $details;
  var $data;
  var tasksData;
  var listData;
  var listOfTasks;
  var listForTreeMap = new Array();
  var dataForTreeMap;

  var countLists = 9999;

  // ui
  var uiTree;

  // When document loaded
  $(function () {

    $lists = $('.stack.lists');
    $tasks = $('.stack.tasks');
    $details = $('.stack.details');

    var SDK = global.wunderlist.sdk;
    wunderlistSDK = new SDK({

      'accessToken': global.underlistConfig.authToken,
      'clientID': global.underlistConfig.clientID
    });

    wunderlistSDK.initialized.then(start);
  });

  function start() {

    loadLists();
    // loadAllTasks();
    initTreeMap();


    // create tree map
    createTreeMapDataStructure();

    listData = [];
  }

  function prepareDataForTreeMap() {
    dataForTreeMap = [
      ['Location', 'Parent', 'Market trade volume (size)', 'Market increase/decrease (color)'],
      ['All', null, 0, 0]
    ];

    listForTreeMap.forEach(function (item) {
      dataForTreeMap.push(item);
    });
  }



  // draw task chart
  function drawChart2() {
    $data = google.visualization.arrayToDataTable(dataForTreeMap);

    uiTree = new google.visualization.TreeMap(document.getElementById('chart_div'));

    uiTree.draw($data, {
      minColor: '#f00',
      midColor: '#ddd',
      maxColor: '#0d0',
      headerHeight: 15,
      fontColor: 'black',
      showScale: true
    });
  }

  function initTreeMap() {
    google.charts.load('current', { 'packages': ['treemap'] });
  }


  function loadLists() {
    wunderlistSDK.http.lists.all().done(displayLists);
  }


  function loadTasks(listID) {
    // load tasks from wunder list and redraw map
    wunderlistSDK.http.tasks.forList(listID).done(displayTasks);
  }

  function loadTaskDetails(taskID) {

    wunderlistSDK.http.tasks.getID(taskID).done(displayTaskDetails);
  }

  function redrawTreeMap(data) {
    // skip until full list is not loaded
   // if (countLists > 0) return;


    prepareDataForTreeMap();
    google.charts.setOnLoadCallback(drawChart2);
  }

  function displayLists(listData) {
  //  listForTreeMap = new Array();

    var $ul = $lists.find('ul');
    var frag = document.createDocumentFragment();


    // display
    listData.forEach(function (list) {
      // add row to tree map
     // listForTreeMap.push(getTreeMapRow(list, list.title));
      // create UI row
      var $li = $('<li class="list-group-item"><a rel="' + list.id + '" href="#list-' + list.id + '">' + list.title + '</a></li>');
      frag.appendChild($li[0]);
    });
    $ul.html(frag);

    // redraw tree map to show tasks priority
    redrawTreeMap(listForTreeMap);

    bindToLists();
  }

  function createTreeMapDataStructure() {
    // rembeber total number of lists
    //  countLists = list.length;
    // settup timeout to redrwa list (clear to be sure that there is only one)
    //  clearInterval(timer);
    //  var timer = setInterval(redrawTreeMap, 1000);
    wunderlistSDK.http.lists
      .all()
      .done(function (lists) {
        lists.forEach(function (list) {
          // list item - parent shuld be All
          listForTreeMap.push(getTreeMapRow(list, 'All',true));
          wunderlistSDK.http.tasks
            .forList(list.id)
            .done(function (tasks) {
                // add tasks
                tasks.forEach(function(item){
                  // add task data to tree data structure
                listForTreeMap.push(getTreeMapRow(item, list.title+' (LIST)',false));
        redrawTreeMap();
                });
            });
        });
        redrawTreeMap();
      });
  }

  function getTreeMapRow(item, parent, list) {
    if(list == null){ list = false;}
    var val = 1;
    var size = 1;
    var title = item.title;
    if(item.starred == true)
    {
      val += 10;
    }
    val += (title.match(new RegExp("!", "g")) || []).length*5;
    size = val;
    if (list){
        title += ' (LIST)'
    }
    return [title, parent, size, val];
  }

  // show list of tasks and redraw tree map
  function displayTasks(taskData) {
    //listForTreeMap = new Array();

    var $ul = $tasks.find('div');
    var frag = document.createDocumentFragment();
    taskData.forEach(function (task) {
      // add row to tree map
    //  listForTreeMap.push(getTreeMapRow(task, null));
      // create UI row
      var $li = $('<a class="list-group-item" rel="' + task.id + '" href="#task-' + task.id + ' ">' + task.title + '</a>');
      frag.appendChild($li[0]);
    });
    $ul.html(frag);

    // redraw tree map to show tasks priority
    redrawTreeMap(listForTreeMap);

    bindToTasks();
  }

  function displayTaskDetails(details) {

    console.log(details);

    var $table = $details.find('table');
    var frag = document.createDocumentFragment();

    var tr, key, value;
    for (var attribute in details) {

      tr = document.createElement('tr');
      key = document.createElement('td');
      key.textContent = attribute;
      value = document.createElement('td');
      value.textContent = details[attribute];

      tr.appendChild(key);
      tr.appendChild(value);

      frag.appendChild(tr);
    }
    $table.html(frag);
  }


  ////////////////////////////////////////////////////////////////////
  // click binds
  function bindToLists() {

    $lists.find('a').on('click', function (ev) {

      var listID = $(ev.currentTarget).attr('rel');
      listID && loadTasks(listID);
    });
  }

  function bindToTasks() {

    $tasks.find('a').on('click', function (ev) {

      var taskID = $(ev.currentTarget).attr('rel');
      taskID && loadTaskDetails(taskID);
    });
  }


  function showStaticTooltip(row, size, value) {
    return '<div style="background:#fd9; padding:10px; border-style:solid">' +
           'Read more about the <a href="http://en.wikipedia.org/wiki/Kingdom_(biology)">kingdoms of life</a>.</div>';
  }

 
})(this);