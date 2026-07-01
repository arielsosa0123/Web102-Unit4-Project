import { useState } from 'react'
import './App.css'

// My Dog API key, kept safe in the .env file so it's not hard-coded here
const API_KEY = import.meta.env.VITE_DOG_API_KEY

function App() {
  const [currentDog, setCurrentDog] = useState(null) // the breed I'm showing right now
  const [image, setImage] = useState("")             // the picture for that dog
  const [banList, setBanList] = useState([])         // stuff I don't want to see anymore

  // A dog passes if none of its attributes show up in my ban list
  const isAllowed = (breed) =>
    !banList.some((ban) => breed[ban.attribute] === ban.value)

  // What happens when I hit the Discover button
  const discoverDog = async () => {
    // Try a handful of times to land on a dog I haven't banned
    for (let attempt = 0; attempt < 20; attempt++) {
      // Grab a random dog photo that actually has breed info attached
      const searchRes = await fetch(
        "https://api.thedogapi.com/v1/images/search?has_breeds=1&limit=1",
        { headers: { "x-api-key": API_KEY } }
      )
      const searchData = await searchRes.json()
      const imageId = searchData[0].id

      // Look up that exact photo to get its real breed + details, so the
      // picture and the info always belong to the same dog
      const detailRes = await fetch(
        `https://api.thedogapi.com/v1/images/${imageId}`,
        { headers: { "x-api-key": API_KEY } }
      )
      const detail = await detailRes.json()
      const breed = detail.breeds[0]
      if (!breed) continue // no breed on this one, try again

      // If it's banned, spin again for a different dog
      if (!isAllowed(breed)) continue

      // Put the new dog on screen and stop looking
      setImage(detail.url)
      setCurrentDog(breed)
      return
    }
    alert("Couldn't find a dog that isn't banned — try removing some bans.")
  }

  // Tapping an attribute bans it; tapping it again lets it back in
  const toggleBan = (attribute, value) => {
    const alreadyBanned = banList.some(
      (ban) => ban.attribute === attribute && ban.value === value
    )
    if (alreadyBanned) {
      setBanList(
        banList.filter((ban) => !(ban.attribute === attribute && ban.value === value))
      )
    } else {
      setBanList([...banList, { attribute, value }])
    }
  }

  return (
    <div className="App">
      <h1>Veni Vici! 🐶</h1>
      <p>Discover dogs from around the world!</p>

      <br></br>

      {/* The card is always here; the button lives inside it */}
      <div className="dog-card">
        <button onClick={discoverDog}>Discover a Dog</button>

        {/* Before the first discover, show a friendly welcome instead of a dog */}
        {!currentDog && (
          <div className="welcome">
            <img
              src="/dogs.jpg"
              alt="A bunch of dogs"
              width="300"
            />
            <h2>We love dogs!</h2>
          </div>
        )}

        {/* The dog itself only shows up once I've discovered my first one */}
        {currentDog && (
          <>
            <img src={image} alt={currentDog.name} width="300" />
            <h2>{currentDog.name}</h2>

            {/* Each of these is tappable to ban that value */}
            <div className="attributes">
              <span className="attribute" onClick={() => toggleBan("breed_group", currentDog.breed_group)}>
                Breed Group: {currentDog.breed_group || "Unknown"}
              </span>
              <span className="attribute" onClick={() => toggleBan("life_span", currentDog.life_span)}>
                Life Span: {currentDog.life_span}
              </span>
              <span className="attribute" onClick={() => toggleBan("origin", currentDog.origin)}>
                Origin: {currentDog.origin || "Unknown"}
              </span>
            </div>

            <p className="temperament">{currentDog.temperament}</p>
          </>
        )}
      </div>

      {/* Everything I've banned — tap one to bring it back */}
      <div className="ban-section">
        <h3>Ban List</h3>
        <p className="hint">Click an attribute above to ban it. Click it here to remove it.</p>
        <div className="ban-list">
          {banList.map((ban, index) => (
            <span
              key={index}
              className="banned"
              onClick={() => toggleBan(ban.attribute, ban.value)}
            >
              {ban.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
