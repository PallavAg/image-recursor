import React, { useState, useEffect } from "react";
import "./App.css";
import gifshot from "gifshot";
import OpenAI from "openai";
import "./firebase.js";

const API_KEY = "";
const PATH1 =
  "m72.97,56.78l-15.81-6.9c-3.82-1.67-6.87-4.72-8.54-8.54l-6.9-15.81c-.54-1.23-2.27-1.23-2.81,0l-6.9,15.81c-1.67,3.82-4.72,6.87-8.54,8.54l-15.84,6.91c-1.22.53-1.23,2.27,0,2.81l16.11,7.12c3.81,1.69,6.85,4.75,8.5,8.58l6.68,15.51c.53,1.23,2.28,1.24,2.81,0l6.89-15.79c1.67-3.82,4.72-6.87,8.54-8.54l15.81-6.9c1.23-.54,1.23-2.27,0-2.81Z";
const PATH2 =
  "m92.76,26.84l-9.14-3.99c-2.21-.96-3.97-2.73-4.93-4.93l-3.99-9.14c-.31-.71-1.31-.71-1.62,0l-3.99,9.14c-.96,2.21-2.73,3.97-4.93,4.93l-9.15,3.99c-.71.31-.71,1.31,0,1.62l9.31,4.12c2.2.97,3.96,2.75,4.91,4.96l3.86,8.96c.31.71,1.32.71,1.63,0l3.98-9.12c.96-2.21,2.73-3.97,4.93-4.93l9.14-3.99c.71-.31.71-1.31,0-1.62Z";

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [prompt, setPrompt] = useState("");
  const [imageCount, setImageCount] = useState(10);
  const [apiKey, setApiKey] = useState(API_KEY);
  const [loadingText, setLoadingText] = useState("");
  const [gifURL, setGifURL] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [results, setResults] = useState([]);
  // const [results, setResults] = useState([
  //   {
  //     content:
  //       "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
  //     isImage: true,
  //   },
  //   {
  //     content:
  //       "This is the prompt used to generate the image above that I will use to generate the dalle image",
  //     isImage: false,
  //   },
  //   {
  //     content:
  //       "https://i.imgur.com/Jx9FWK2_d.webp?maxwidth=520&shape=thumb&fidelity=high",
  //     isImage: true,
  //   },
  //   {
  //     content:
  //       "This is the prompt used to generate the image above that I will use to generate the dalle image",
  //     isImage: false,
  //   },
  // ]);

  const handleAboutClick = () => {
    setShowAbout(!showAbout);
  };
  const aboutContent = () => {
    return (
      <div className="p-4 text-white bg-gradient-to-br from-blue-800 to-blue-900">
        {/* Your about content here */}
        <h2 className="font-bold text-2xl pb-1">About Image Recursor</h2>
        <div className="text-xs sm:text-lg md:text-lg lg:text-lg">
          <p>Write a starting prompt and see how it changes over time!</p>
          <p>Your API Key always stays on-device</p>
        </div>
        {/* Follow me on twitter button */}
        <a
          href="https://twitter.com/pallavmac"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mt-4"
        >
          Follow Me on Twitter
        </a>
      </div>
    );
  };

  function createGIF() {
    console.log("Creating GIF");
    // Extract image urls from results
    const imageUrls = results
      .filter((item) => item.isImage)
      .map((item) => item.content)
      .reverse();

    imageUrls.push(imageUrls[imageUrls.length - 1]);
    console.log("Image URLs len:", imageUrls.length);

    gifshot.createGIF(
      {
        images: imageUrls,
        gifWidth: 1024,
        gifHeight: 1024,
        interval: 0.85, // Time in seconds between frames
      },
      function (obj) {
        if (!obj.error) {
          setGifURL(obj.image);
        } else {
          console.error("!!! Error creating GIF !!!", obj.error);
        }
      },
    );
  }

  useEffect(() => {
    if (isComplete) {
      createGIF();
    }
  }, [results, isComplete]);

  async function handleGenerate() {
    if (!prompt) {
      alert("A starting prompt is needed to begin.");
      return;
    }
    if (!apiKey) {
      alert("An API Key is needed to begin.");
      return;
    }
    console.log(imageCount);
    if (!imageCount || imageCount < 1) {
      alert("Image count must be greater than 0.");
      return;
    }
    setResults([]);
    setIsComplete(false);
    setGifURL("");
    console.log("Results:", results);
    console.log("Generating images with:", { prompt, imageCount });
    var nextPrompt = prompt;

    for (let i = 0; i < imageCount; i++) {
      setLoadingText(`Generating DALL-E 3 image ${i + 1} of ${imageCount}...`);
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: nextPrompt,
        quality: "standard",
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      });
      let image_b64 = `data:image/png;base64,${imageResponse.data[0].b64_json}`;
      console.log("Image URL Len:", image_b64.length);
      setResults((prevResults) => [
        { content: image_b64, isImage: true },
        { content: "Loading...", isImage: false },
        ...prevResults,
      ]);

      setLoadingText(
        `Generating GPT-4 Vision Description ${i + 1} of ${imageCount}...`,
      );
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this image. The output will be used to generate the prompt on DALL-E so output only the DALL-E prompt. To add some fun, describe something random that doesn't exist in the image.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image_b64,
                  detail: "low",
                },
              },
            ],
          },
        ],
      });
      nextPrompt = visionResponse.choices[0].message.content;
      console.log("Vision Prompt:", nextPrompt);
      setResults((results) => {
        const newResults = [...results];
        newResults[1].content = nextPrompt;
        return newResults;
      });
    }

    setIsComplete(true);
    setLoadingText("");
  }

  function ResultsList() {
    // Filter out pairs of image and text
    const pairs = results.reduce((acc, item, index, array) => {
      if (item.isImage && array[index + 1] && !array[index + 1].isImage) {
        acc.push([item, array[index + 1]]);
      }
      return acc;
    }, []);

    return (
      <div className="px-2">
        <div className="flex flex-col items-center justify-center space-y-4">
          {loadingText && (
            <div className="mt-4 py-1 px-4 rounded-lg text-white bg-gray-700 opacity-70">
              {loadingText}
            </div>
          )}
          {pairs.map(([imageItem, textItem], index) => (
            <div
              key={index}
              className="bg-black rounded-lg shadow-md overflow-hidden max-w-sm w-full"
            >
              <img
                src={imageItem.content}
                alt={`Generated DALL-E 3 Output ${pairs.length - index}`}
                className="w-full h-auto rounded-t-lg"
              />
              <div className="px-4 pb-4 pt-1">
                <p className="text-sm text-gray-400 font-bold">
                  Generated DALL-E 3 Image {pairs.length - index}
                </p>
                {textItem.content && (
                  <p className="font-bold mt-2 text-xs">
                    GPT-4 Vision Description:{" "}
                    <span className="font-normal">{textItem.content}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <nav className="bg-zinc-800 p-4 text-white flex justify-between">
        <div className="font-bold" onClick={() => setShowAbout(false)}>
          Image Recursor
        </div>
        <div>
          {/* Other navigation items here */}
          <button className="ml-4" onClick={handleAboutClick}>
            {showAbout ? "Hide" : "About"}
          </button>
        </div>
      </nav>
      {showAbout && aboutContent()}
      <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-gray-950 to-blue-950 pt-6 font-sans text-white">
        <h1 className="text-3xl sm:text-5xl md:text-5xl lg:text-5xl p-2 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400 mb-6">
          DALL-E 3 & GPT-4 Vision <br /> Image Recursor
        </h1>
        <div className="bg-gradient-to-br from-zinc-950 to-neutral-900 rounded-xl w-lg p-4 mb-4 mx-2 shadow-md shadow-gray-900 text-left border border-white">
          <div className="mb-4">
            <label
              htmlFor="prompt"
              className="mb-2 block text-sm font-semibold text-gray-200 text-left"
            >
              Starting Image Prompt
            </label>
            <textarea
              id="prompt"
              placeholder="Choose a starting image prompt"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 p-2 text-white shadow-md focus:outline-none overflow-hidden"
              style={{ maxHeight: "3.5rem" }} // This height is roughly two lines of text, adjust as necessary for your font size.
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              autoComplete="off"
              rows="1"
            />
          </div>
          {/* Second Input Row */}
          <div className="flex justify-between mb-2">
            {/* Count Input */}
            <div className="flex-1 mr-2">
              <label
                htmlFor="count"
                className="mb-2 block text-sm font-semibold text-gray-200"
              >
                # of Loops
              </label>
              <input
                id="count"
                type="number"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 p-2 text-white shadow-md focus:outline-none"
                value={imageCount}
                autoComplete="off"
                min="1"
                onChange={(e) => {
                  setImageCount(Math.max(1, e.target.valueAsNumber));
                }}
              />
            </div>
            {/* API Key Input */}
            <div className="flex flex-col ml-2">
              <div className="flex items-center mb-2">
                <label
                  htmlFor="api-key"
                  className="text-sm font-semibold text-gray-200 mr-2"
                >
                  OpenAI API Key
                </label>
                <div className="relative group">
                  <button
                    type="button"
                    className="text-gray-200 hover:text-gray-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="2 0 20 17"
                      fill="currentColor"
                    >
                      <path d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-8-3a1 1 0 100-2 1 1 0 000 2zm1 2H9v5h2V9z" />
                    </svg>
                  </button>
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 rounded-md bg-gray-800 p-2 text-sm text-gray-100">
                    Your API key stays on-device
                  </div>
                </div>
              </div>
              <input
                id="api-key"
                type="password"
                placeholder="sk-123..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 p-2 -mt-1 text-white shadow-md focus:outline-none"
                value={apiKey.replace(/./g, "●")}
                onChange={(e) => {
                  openai.apiKey = e.target.value;
                  setApiKey(e.target.value);
                }}
              />
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-4">
            Gartic phone for images: Write a prompt and see how it changes over
            time!
          </p>
        </div>
        <button
          className="flex transform items-center mt-2 justify-center text-2xl rounded-lg bg-blue-600 px-6 py-2 font-black text-white shadow-md transition duration-200 ease-in-out hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-0 active:scale-95 active:bg-blue-800"
          onClick={async () => {
            try {
              await handleGenerate();
            } catch (e) {
              setLoadingText("");
              console.error(e);
              if (results.length > 0) {
                setIsComplete(true);
                alert("OpenAI API returned an error.");
              } else {
                alert(
                  "Error generating images. Check your API Key or internet connection.",
                );
              }
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            data-name="Icon"
            className="mr-2 h-6 w-6"
            viewBox="2 0 110 100"
            x="0px"
            y="0px"
            fill="currentColor"
            stroke="currentColor"
          >
            <path d={PATH1} />
            <path d={PATH2} />
          </svg>
          Generate
        </button>
        {gifURL && (
          <div className="max-w-lg p-4 w-full text-center">
            <h1 className="font-black text-3xl pb-1">Result ✨</h1>
            <img src={gifURL} alt="Generated GIF" className="rounded-sm" />
            <a
              href={gifURL}
              download="image-recuror-result.gif"
              className="mt-2 inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Save GIF
            </a>
          </div>
        )}
        <div className="my-4">{ResultsList()}</div>
      </div>
    </div>
  );
}

// {gifURL && (
//   <div className="max-w-lg p-4 w-full text-center">
//     <h1 className="font-black text-3xl pb-1">Result ✨</h1>
//     <img src={gifURL} alt="Generated GIF" className="rounded-sm" />
//   </div>
// )}
// <div className="my-4">{ResultsList()}</div>
export default App;

/* 
Todo
- Start with an image url
- Advanced options (HD, Prompt etc.)
- Remove console output
- Share GIF link
- Keep producing button
- Error Handling - DONE
- About Tab? - DONE
- Hide API Key - DONE
- Use table input format? - DONE
- Stop on error - Done
- Download GIF - DONE
- OpenAI Info Button - DONE
*/
