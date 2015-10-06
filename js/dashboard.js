BUILD_STATE_LABEL_CLASSES = {
  'Passed': 'label-success',
  'Building': 'label-warning',
  'Failed': 'label-danger',
  'Cancelled': 'label-default'
  }

BUILD_STATE_TEXT_CLASSES = {
  'Passed': 'text-success',
  'Building': 'text-warning',
  'Failed': 'text-danger',
  'Cancelled': 'text-default'
  }

var cachedData = Array();

function populatePipelineGroup(group) {
  $( "#pipeline-groups" ).append( pipeline_group_template( { name: group.name } ))

  $.each( group.pipelines, function(i , pipeline) {
    if ( pipeline.instances[0] ) {
      pipeline.instances[0].latest_stage_state_text_class = BUILD_STATE_TEXT_CLASSES[pipeline.instances[0].latest_stage_state]
      $.each( pipeline.instances[0].stages, function(i , stage) {
        pipeline.instances[0].stages[i].status_label_class = BUILD_STATE_LABEL_CLASSES[stage.status]
      });
    }
    $( "#pipeline-group-" + group.name ).append( pipeline_badge_template( pipeline ))
  });
}

function queryParse(querystring) {
  var result = {};
  (querystring || '').replace(
      new RegExp("([^?=&]+)(=([^&]*))?", "g"),
      function($0, $1, $2, $3) {
          result[$1] = $3 !== undefined ? decodeURIComponent($3) : $3;
      }
  );
  return result;
}

function showError( html ) {
  $( '#error-text' ).append( html + '<br>');
  $( '#error-panel' ).show();
}

function dashboardUrl(query) {
  server = query.server ? _.trim(query.server, '/' ) : _.trim(config.server, '/' );
  return server + "/go/dashboard.json";
}

function getGroups(query) {
  if ( query.pipeline_groups ) {
    pipeline_groups =  _.trim(query.pipeline_groups, '/' )
  } else {
    pipeline_groups = config.pipeline_groups ? config.pipeline_groups : null
  }

  return pipeline_groups !== null ? pipeline_groups.split(',') : null
}

function hoverGetData(){
    var element = $(this);

    var id = element.data('id');

    if(id in cachedData){
        return cachedData[id];
    }

    var localData = "error";

    $.ajax(id, {
        async: false,
        success: function(data){
            localData = data;
        }
    });

    cachedData[id] = localData;

    return localData;
}

/////////
/////////


pipeline_group_template = Handlebars.compile( $("#pipeline-group-template").html() );
pipeline_badge_template = Handlebars.compile( $("#pipeline-badge-template").html() );

Handlebars.registerHelper('reldate', function(epoch) {
  return moment(epoch).fromNow();
});

query = queryParse( window.location.search );
groups = getGroups(query)



$.ajax({
  dataType: "json",
  url: dashboardUrl(query),
  timeout: 2000
}).done(function( data ) {
  if ( groups !== undefined && groups !== null ) {
    $.each( groups, function(i , group) {
      group_object = _.find(data, { 'name': group } )
      if ( typeof group_object !== 'undefined' ) {
        populatePipelineGroup( group_object );
      } else {
        showError( "Pipeline group '" + group + "' was not found in the data returned from " + url );
      }
    });
  } else {
    $.each( data, function(i , val) {
      populatePipelineGroup(val);
    });
  };

  $('.hover-tooltip').tooltip({
    title: hoverGetData,
    html: true,
    container: 'body',
    delay: { "show": 100, "hide": 1500 }
  });

 //$('*[data-poload]').mouseenter(function() {
 //   var e=$(this);
 //   e.off('hover');
 //   $.get(e.data('poload'),function(d) {
 //       e.popover({content: d, html : true, placement: 'left'}).popover('show');
 //   });
 // }).mouseleave(function() {
 //   $(this).popover('hide');

 // });
}).fail(function( jqxhr, textStatus, error ) {
  error_html = "Unable to fetch data from " + url
  if ( error ) {
    error_html = error_html + "<br>Error: " + error
  }
  showError( error_html );
});