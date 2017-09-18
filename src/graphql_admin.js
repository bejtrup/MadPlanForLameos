var graphQLEndpoint = 'https://api.graph.cool/simple/v1/cj7jflnup02bp0138ccetefib';

function getIngridiensAndUnites() {
  $.post({
    url: graphQLEndpoint,
    data: JSON.stringify({ "query": "{ 	allIngredienseTypes {    id    name    unitses {      id      name    }  }}" }),
    contentType: 'application/json'
  }).done(function(response) {
    console.log(response);
    var compiledTemplate = Handlebars.compile( $("#makeIngridiensForm").html() );
    var generatedTemplate = compiledTemplate(response);
    for( var i = 0; i <= 10; i++){
      $("#ingredienser_wrapper").append(generatedTemplate);
    }
  });
}

function createRecipe() {
  var name = $('#recipe-name').val();
  var instruction = $('#recipe-instructions').val();
  var q = 'mutation { createOpskrift(name: "' + name + '" instruction: "'+instruction+'" ingrediensers:[';
  $("#ingredienser_wrapper div").each(function(){
      var amount = $(this).find("input").val();
      var typeId = $(this).find('.type option:selected').attr('value');
      if(amount){
        q += '{amount: '+amount+' ingredienseTypesIds: "'+typeId+'"},';
      }
  });
  q += ']){ id } }'

  $.post({
    url: graphQLEndpoint,
    data: JSON.stringify({ "query": q }),
    contentType: 'application/json'
  }).done(function(response) {
    $("#create-recipe-reply").append("done");
  });
}

function selectChanged(elem){
  var unitid = $(elem).find(':selected').data('unitid');
  var unitname = $(elem).find(':selected').data('unitname');
  $(elem).siblings(".unit").text(unitname);
  $(elem).siblings(".unit").attr("data-unitid",unitid);
  $(elem).siblings("input").focus();
}
