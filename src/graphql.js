var graphQLEndpoint = 'https://api.graph.cool/simple/v1/cj7jflnup02bp0138ccetefib';
var userId = "cj7mziq54j6q301057e4go5yg";
var allRecipes = [];
var foodPlan = [];
var groceryList =[];

function fetchAllRecipes() {
  $.post({
    url: graphQLEndpoint,
    data: JSON.stringify({ "query": "{ allOpskrifts{ id name ingrediensers{ amount ingredienseTypes{ id name bulk unitses{ name shorthand }  } } } }" }),
    contentType: 'application/json'
  }).done(function(response) {
      allRecipes = response.data;
      initPage();
  });
}

function initPage(){
  makePreviewRecipeList();
}

function makePreviewRecipeList(){
  var compiledTemplate = Handlebars.compile( $("#previewRecipes").html() );
  var generatedTemplate = compiledTemplate(allRecipes);
  $("#recipe-list").html(generatedTemplate);
}

function addToFoodPlan(recipeId){
  function idInArray(arr,value){
    for(var i = 0; i < arr.length; i++) {
      if(arr[i].id === value) {
        return i;
      }
    }
  }
  var indexOfId = idInArray(allRecipes.allOpskrifts, recipeId);
  allRecipes.allOpskrifts[indexOfId].ingrediensers.forEach(function (v) {
     var indexOfgros = idInArray(groceryList, v.ingredienseTypes[0].id);
     if(indexOfgros >= 0){
       var i = groceryList[indexOfgros].amount + v.amount;
       groceryList[indexOfgros].amount = i;
     }
     else{
       groceryList.push({id: v.ingredienseTypes[0].id, name: v.ingredienseTypes[0].name, amount: v.amount, unit: v.ingredienseTypes[0].unitses[0].shorthand, bulk: v.ingredienseTypes[0].bulk });
     }
  });
  var compiledTemplate = Handlebars.compile( $("#groceryListItem").html() );
  var generatedTemplate = compiledTemplate(groceryList);
  $("#grocery-list").html(generatedTemplate);


  allRecipes.allOpskrifts[indexOfId].inFoodplan = true;
  foodPlan.push(allRecipes.allOpskrifts[indexOfId]);
  updatePageHeadline();

  newOrderArray();
  makePreviewRecipeList();
  return false;
}

function newOrderArray(){
  groceryList.forEach(function(item){
    allRecipes.allOpskrifts.forEach(function(recipe){
      if(!recipe.groceryMatch ) {recipe.groceryMatch = 0;}
      recipe.ingrediensers.forEach(function(ingridiens){
        if(item.id === ingridiens.ingredienseTypes[0].id){
            var i = recipe.groceryMatch + 1 ;
            recipe.groceryMatch = i;
        }
      });
    });
  });
  allRecipes.allOpskrifts.sort(SortByGroceryMatch).reverse();
}
function SortByGroceryMatch(a, b){
  var aName = a.groceryMatch;
  var bName = b.groceryMatch;
  return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}


function updatePageHeadline(){
  var H = "Vælg ret til "+(foodPlan.length+1)+". dag";
  $("#pageHeadline").text(H);
  return false;
}
