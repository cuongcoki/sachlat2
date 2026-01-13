function PokemonPage({ pokemon }) {
  const getTypeColor = (type) => {
    const colors = {
      electric: "bg-yellow-500",
      ground: "bg-orange-600",
      poison: "bg-purple-600",
      fire: "bg-red-600",
      flying: "bg-blue-500",
      water: "bg-blue-700",
      dark: "bg-gray-700",
      fighting: "bg-orange-700",
      steel: "bg-gray-500",
      rock: "bg-amber-700"
    };
    return colors[type.toLowerCase()] || "bg-gray-400";
  };

  return (
    <div className="bg-linear-to-br from-white to-gray-100 rounded-md shadow-md">
      <div className="w-full h-full flex flex-col justify-center items-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 w-full">
          <img 
            src={`https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/${pokemon.id}.png`} 
            alt={pokemon.name}
            className="w-[85%] max-h-[320px] object-contain transition-transform duration-300 hover:scale-105"
          />
          
          <div className="w-full">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#2c3e50] mb-1">
              {pokemon.name}
            </h2>
            
            <p className="text-sm md:text-base text-gray-600 mb-3">
              #{pokemon.id}
            </p>
            
            <div className="mb-3">
              {pokemon.types.map((type) => (
                <span 
                  key={type} 
                  className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium text-white mx-1 mb-1 ${getTypeColor(type)}`}
                >
                  {type}
                </span>
              ))}
            </div>
            
            <p className="text-sm md:text-base text-[#34495e] mt-3 leading-relaxed px-2">
              {pokemon.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default PokemonPage;