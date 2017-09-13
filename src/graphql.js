var graphQLEndpoint = 'https://api.graph.cool/simple/v1/__YOUR_PROJECT_ID__';

function createPokemon() {
  var name = $('#pokemon-name').val();
  console.log('createPokemon', name)
  $.post({
    url: graphQLEndpoint,
    data: JSON.stringify({ "query": "mutation { createPokemon(name: \"" + name + "\" ) { id name } } " }),
    contentType: 'application/json'
  }).done(function(response) {
    console.log('Received response: ', response);
    var pokemonList = document.getElementById("pokemon-list");
    var pokemon = response.data.createPokemon
    var li = document.createElement("li");
    li.textContent = pokemon.name;
    pokemonList.appendChild(li);
  });
}

function fetchAllPokemons() {
  console.log('fetchAllPokemons')
  $.post({
    url: graphQLEndpoint,
    data: JSON.stringify({ "query": " { allPokemons { id name } } " }),
    contentType: 'application/json'
  }).done(function(response) {
    console.log('Received response: ', response);
    var pokemonList = document.getElementById("pokemon-list");
    response.data.allPokemons.forEach(function (pokemon) {
        var li = document.createElement("li");
        li.textContent = pokemon.name;
        pokemonList.appendChild(li);
    });
  });
}
