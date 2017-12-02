var graphQLEndpoint = 'https://api.graph.cool/simple/v1/cj7jflnup02bp0138ccetefib';
var userId = "cj7mziq54j6q301057e4go5yg";
var allRecipes = [];
var foodPlan = [];
var groceryList =[];

function fetchAllRecipes() {
  // var arr = arrAll.data;
  // console.log("from js file");
  // allRecipes = arr;
  // adsColorProfileToAllRecipes();
  // initPage();


  var allRecipesStored = JSON.parse(localStorage.getItem("allRecipes"));
  if(allRecipesStored === null){
    console.log("Getting Data online");
    $.post({
      url: graphQLEndpoint,
      data: JSON.stringify({ "query": "{ allOpskrifts (orderBy: rating_DESC) { id name rating instruction ingrediensers{ amount ingredienseTypes{ id name bulk group unitses{ name shorthand }  } } } }" }),
      contentType: 'application/json'
    }).done(function(response) {
      allRecipes = response.data;
      adsColorProfileToAllRecipes();
      localStorage.setItem("allRecipes", JSON.stringify(allRecipes));
      initPage();
    });
  } else {
    allRecipes = allRecipesStored;
    console.log("from localStorage");
    initPage();
  }
}

function adsColorProfileToAllRecipes(){
  var count = 1
  allRecipes.allOpskrifts.forEach(function(item){
    item.colorProfile = count;
    count++
    count = count > 15 ? 1 : count;

  });
}

function initPage(){
  var urlHash = window.location.hash.substr(1);
  var foodPlanStored = JSON.parse(localStorage.getItem("foodplan"));

  if (foodPlanStored && foodPlanStored.length > 0){
    foodPlan = foodPlanStored;
    makeBuildPage();
  }
  else if (urlHash == "recipe" ){
    //makeRecipePage();
  }
  else{
    makeFrontpage();
  }
}

function makeFrontpage() {
  $("#Carousel").addClass("d-none");
  $("#CarouselNextPrev").addClass("d-none");
  $("#Recipe-List").html('');
  $("#Foodplan-Build-List").html('');
  var compiledTemplate = Handlebars.compile( $("#recipe-cards").html() );
  var generatedTemplate = compiledTemplate(allRecipes.allOpskrifts);
  $("#RecipeContainer").html(generatedTemplate);
}

function makeBuildPage() {
    foodPlan.forEach(function(k,v){
      beginNewFoodplan(k.recipieid);
    });
}

function beginNewFoodplan(recipeId){
    $("#Carousel").removeClass("d-none");
    $("#CarouselNextPrev").removeClass("d-none");

    hideFullRecipe(recipeId);

    addToFoodPlan(recipeId);
    makeFoodplanRecipieCardList(recipeId);
}

var dist = 140;
function addToFoodPlan(recipeId){
    // MAKE GROCERYLIST
    var indexOfId = idInArray(allRecipes.allOpskrifts, recipeId);
    var persons = 2;
    allRecipes.allOpskrifts[indexOfId].ingrediensers.forEach(function (v) {
       var indexOfgros = idInArray(groceryList, v.ingredienseTypes[0].id);
       if(indexOfgros >= 0){
         var i = groceryList[indexOfgros].amount + (v.amount*persons);
         groceryList[indexOfgros].amount = i;
         if(groceryList[indexOfgros].bulk) {
           var newLeftover = groceryList[indexOfgros].leftover - (v.amount*persons);
           groceryList[indexOfgros].leftover = newLeftover;
         }
       }
       else{
         var leftover = v.ingredienseTypes[0].bulk - (v.amount*persons)
         groceryList.push({id: v.ingredienseTypes[0].id, name: v.ingredienseTypes[0].name, amount: (v.amount*persons), unit: v.ingredienseTypes[0].unitses[0].shorthand, bulk: v.ingredienseTypes[0].bulk, group: v.ingredienseTypes[0].group, leftover: leftover });
       }
    });

    allRecipes.allOpskrifts[indexOfId].inFoodplan = true;
    var a = JSON.parse(localStorage.getItem("foodplan")) || [];
    if( recipieidInArray(a, recipeId) < 0 || recipieidInArray(a, recipeId) == undefined){
      foodPlan.push({day: (foodPlan.length + 1), recipieid: allRecipes.allOpskrifts[indexOfId].id, name: allRecipes.allOpskrifts[indexOfId].name, colorProfile: allRecipes.allOpskrifts[indexOfId].colorProfile});
    // STORE FOODPLAN IN LOCALHOST
      localStorage.setItem("foodplan", JSON.stringify(foodPlan));
    }

  // MAKE FOODPLAN BUILD LIST
  // MAKE HEADER FOR INGRIDIENS LIST
       var compiledTemplate = Handlebars.compile( $("#Foodplan-Build").html() );
       var generatedTemplate = compiledTemplate(foodPlan);
       $("#Foodplan-Build-List").html(generatedTemplate);
  //   // MAKE THE LIST
       makeGroseryListTest("groceryList-to-Test", groceryList);
  // MAKE RECIPES TO TEST
   newOrderArray();
   makeCarouselRecipeCardList();
   makeCarousel();

  return false;
}

function removeFromFoodplan(recipeId){
  // SHOW STARS SELECT

  // allRecipes.allOpskrifts inFoodplan == false
  var recipeToChange =  allRecipes.allOpskrifts[idInArray(allRecipes.allOpskrifts,recipeId)];
  recipeToChange.inFoodplan = false;
  // REMOVE FROM foodPlan [] AND RERUN makeFoodplanRecipieCardList()
  foodPlan = foodPlan.filter(function(el){
    return el.recipieid !== recipeId;
  });
  // REMOVE FROM LOCALHOST (update localhost )
  localStorage.setItem("foodplan", JSON.stringify(foodPlan));
  // REMOVE INGRIDIENS FROM groceryList AND RERUN makeGroseryListTest()
  groceryList = [];
  if(foodPlan.length > 0 ){
    makeBuildPage();
  } else{
    makeFrontpage();
  }
}

function makeGroseryListTest(id, arr){
  arr.sort(SortByGroup);
  var compiledTemplate = Handlebars.compile( $("#groceryListTest").html() );
  var generatedTemplate = compiledTemplate(arr);
  $("#groceryList-to-Test").html(generatedTemplate);
}

function compareActiveRecipeAndGroceryList(activeRecipeID){
    var testGroceryList =[];
    testGroceryList = JSON.parse(JSON.stringify(groceryList));
    if(activeRecipeID != undefined && $("#RecipeContainer #"+activeRecipeID).length === 0 ){
      var activeRecipeIndex = idInArray(allRecipes.allOpskrifts, activeRecipeID);
      var persons = 2;
      allRecipes.allOpskrifts[activeRecipeIndex].ingrediensers.forEach(function(ing){
        var testIngId = ing.ingredienseTypes[0].id;
        var ingrediensersIndex = idInArray(testGroceryList, testIngId);
        if(ingrediensersIndex != undefined){
          // UPDATE GROCERYLIST WITH SIMILAR ITEMS
          var newTotalAmount = groceryList[ingrediensersIndex].amount + (ing.amount*persons);
          testGroceryList[ingrediensersIndex].amount = newTotalAmount;
          var newLeftover = groceryList[ingrediensersIndex].leftover - (ing.amount*persons);
          testGroceryList[ingrediensersIndex].leftover = newLeftover;
          testGroceryList[ingrediensersIndex].isTested = true;
        } else {
          // ADD NEW ITEMS TO GROCERYLIST
          var leftover = ing.ingredienseTypes[0].bulk - (ing.amount*persons);
          testGroceryList.push({ id: ing.ingredienseTypes[0].id, name: ing.ingredienseTypes[0].name, amount:(ing.amount*persons),  unit: ing.ingredienseTypes[0].unitses[0].shorthand, bulk: ing.ingredienseTypes[0].bulk, group: ing.ingredienseTypes[0].group, leftover: leftover, isAddedToList: true});
        }
      });
    }
    makeGroseryListTest(activeRecipeID, testGroceryList);

}

function makeCarouselRecipeCardList(){
  var compiledTemplate = Handlebars.compile( $("#recipe-cards").html() );
  var generatedTemplate = compiledTemplate(allRecipes.allOpskrifts);
  var html = '<div>' +
          '<div class="row previewRecipe mx-3 mb-3 mt-0 px-0 py-5 text-center justify-content-center align-content-center border border-secondary">'+
            '<h3 class="col-12 mx-0"><span aria-hidden="true" class="arrow_left"></span>Swipe</h3>'+
            '<h5>For at finde en opskrift der bruger dine rester</h3>'+
          '</div></div>';
          $("#Recipe-List").html(html);
  $("#Recipe-List").append(generatedTemplate);
  if(foodPlan.length <= 1){
    $(document).scrollTop(0);
  }
}

function makeFoodplanRecipieCardList(recipeId) {
  var compiledTemplate = Handlebars.compile( $("#recipe-cards-small").html() );
  var generatedTemplate = compiledTemplate(foodPlan);
  $("#RecipeContainer").html(generatedTemplate);
}

function SortByGroup(a, b) {
  var aSize = b.group;
  var bSize = a.group;
  var aLow = a.name;
  var bLow = b.name;

  if(aSize == bSize)
  {
      return (aLow < bLow) ? -1 : (aLow > bLow) ? 1 : 0;
  }
  else
  {
      return (aSize < bSize) ? -1 : 1;
  }
}

function makeCarousel(){
  var isSlickLoaded = $("#Recipe-List").hasClass("slick-initialized");
  if(isSlickLoaded){
    $("#Recipe-List").slick('unslick');
  }
    $("#Recipe-List").slick({
      dots: false,
      infinite: false,
      slidesToShow: 1,
      slidesToScroll: 1,
      mobileFirst: true,
      adaptiveHeight: true,
      appendArrows: $("#CarouselNextPrev"),
      prevArrow: '<div class="col d-flex align-items-center justify-content-center order-3 slick-prev"><h3 class="m-0"><span aria-hidden="true" class="arrow_right"></h3></span></div>',
      nextArrow: '<div class="col d-flex align-items-center justify-content-center order-1 slick-next"><h3 class="m-0"><span aria-hidden="true" class="arrow_left"></h3></span></div>'
    });
    $("#Recipe-List").on('afterChange', function(event, slick, currentSlide){
      var activeId = $(this).find("div.slick-active").attr("id")
      compareActiveRecipeAndGroceryList(activeId);
    });
}

function makeBulkPicker(id) {
  $("#keypadwrapper").removeClass("d-none");
  window.setTimeout(function(){
     $("#keypad").addClass("up");
     $("#AmountInput").addClass("show");
  }, 100);
  $("#AmountInputIngridiensID").val(id);
  var index = idInArray(groceryList,id);
  $("#AmountInputName").text(groceryList[index].name);
  $("#AmountInputUnit").text(groceryList[index].unit+".");
  $("#AmountInputBulk").text(groceryList[index].bulk);
  $("#AmountInputBulk").addClass("highlight");
  window.setTimeout(function(){

  }, 300);
}

$(document).ready(function(){
  $("#keypad").on("click", ".key", function(){
    var val = $(this).attr('data-val');
    if(val == "submit"){
      var v = $("#AmountInputBulk").text();
      var AmountInputIngridiensID = $("#AmountInputIngridiensID").val();
      var index = idInArray(groceryList,AmountInputIngridiensID);
      var prevBulk = groceryList[index].bulk;
      groceryList[index].bulk = v;
      var prevLeftover = groceryList[index].leftover;
      groceryList[index].leftover = prevLeftover + (v - prevBulk);
      var i = $('#Recipe-List').slick('slickCurrentSlide');
      if(i > 0){
        var currentRecipieId = $("#Recipe-List").find('.recipe-cards:nth-child('+(i+1)+')').attr("id");
      } else {
        var currentRecipieId = $("#RecipeContainer").find(".recipe-cards").attr("id");
      }
      compareActiveRecipeAndGroceryList(currentRecipieId);

      $("#keypad").removeClass("up");
      $("#AmountInput").removeClass("show");
      window.setTimeout(function(){
        $("#keypadwrapper").addClass("d-none");
      }, 200);

    }
    else if(val == "back"){
      var v = $("#AmountInputBulk").text();
      $("#AmountInputBulk").text(v.slice(0,-1));
    } else{
      if($("#AmountInputBulk").hasClass("highlight")){
        $("#AmountInputBulk").text("");
        $("#AmountInputBulk").removeClass("highlight");
        $("#AmountInputBulk").text(val);
      } else {
        var v = $("#AmountInputBulk").text();
        v += val;
        $("#AmountInputBulk").text(v);
      }
    }
  });

  $(document).on("click", ".recipe-cards--card", function (e) {
    if (!$(e.target).closest(".btn").length ) {
      showFullRecipe($(this));
    }
  });
});

var currentScrollPos = 0;

function showFullRecipe(elem){
  var id = elem.closest(".recipe-cards").attr("id");
  $("div#RecipeFull").removeClass("d-none");

  var res = allRecipes.allOpskrifts[idInArray(allRecipes.allOpskrifts, id)];
  var compiledTemplate = Handlebars.compile( $("#recipe-cards-full").html() );
  var generatedTemplate = compiledTemplate(res);
  $("#RecipeFull").html(generatedTemplate);
}

function hideFullRecipe(id){
  $("#recipiedId_"+id).remove();
}

function checkIngridiens(id){
  $("#"+id).toggleClass("checked");
}

// :::::::::::::::::ALKYRITMEN :::::::::::::::::::
// tage højde for LEFTOVERS !!!
function newOrderArray(){
  groceryList.forEach(function(item){
    allRecipes.allOpskrifts.forEach(function(recipe){
      if(!recipe.groceryMatch ) {recipe.groceryMatch = 0;}
      recipe.ingrediensers.forEach(function(ingridiens){
        if(item.id === ingridiens.ingredienseTypes[0].id){
            // loop trou alle ingridiens and add (groupNo.) if in groceryList
            var i = recipe.groceryMatch + ingridiens.ingredienseTypes[0].group;
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

function idInArray(arr,value){
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].id === value) {
      return i;
    }
  }
}

function recipieidInArray(arr,value){
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].recipieid === value) {
      return i;
    }
  }
}

var currentGroup = '';
Handlebars.registerHelper("groceryGroup", function (group){
    if ( currentGroup == group) {
      return null
    } else {
      currentGroup = group
      var name;
      switch(group) {
          case 0:
              name = "Basis"
              break;
          case 1:
              name = "Kød"
              break;
          case 2:
              name = "Frugt og grønt "
              break;
          case 3:
              name = "Tørstof"
              break;
          case 4:
              name = "Væske"
              break;
      }
      return name;
    }
});
Handlebars.registerHelper("leftoverColor", function (leftover){
      if (leftover < 0){
        return "text-primary";
      }
      if (leftover == 0){
        return "text-secondary";
      }
      if (leftover > 0){
        return "text-info";
      }
});
Handlebars.registerHelper("ratingPlot", function (rating){
  var html = '';
  for (var i = 0; i < rating; i++) {
    html += '<span aria-hidden="true" class="icon_star text-primary"></span>';
  }
  for (var i = 0; i < 5-rating; i++) {
    html += '<span aria-hidden="true" class="icon_star text-secondary"></span>';
  }
  return new Handlebars.SafeString(
    html
  );
});
Handlebars.registerHelper("ingridiensTIMESperson", function (amount){
    var persons = 2;
    return amount * persons;
});
Handlebars.registerHelper("makeInstruction", function (instruction){
    var html = '';
    var ins = JSON.parse(instruction);
    ins.forEach(function(v,k){
      html += "<div class='row'><h6 class='col-1'>"+(k+1)+"</h6><p class='col-11'>"+v.step+"</p></div>";
    });
    return new Handlebars.SafeString(
      html
    );
});
// PROTEIN:
// 10 - Fersk
// 9  - Behanlet (røget tører saltet)  bacon pølse...
//
// Kryderurter
// 8 - friske krydderuter
//
// MajeriProdukter
// 7 - Mælk,ost, cf, …
// 6 - smør, æg
//
// Frugt og grønt
// 5 - let forgængeligt :  salat, frisk bær , advokato
// 4 - holder længere : kål, asspargs, tomater, peper frugt
// 3 - løg, kartofler, gulerodder, æbler, appelsiner, chilli
//
// tørvare
//  2- korn, pasta, tørre krydder urter, nødder, bulgur, rosiner
//
// basis
// 1 - olie, salt peper, sennep eddike
