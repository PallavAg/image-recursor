import React, { useState, useEffect } from "react";
import "./App.css";
import gifshot from "gifshot";
import OpenAI from "openai";

const API_KEY = "";

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
        interval: 1, // Time in seconds between frames
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
    if (imageCount < 1) {
      alert("Image count must be greater than 0.");
      return;
    }
    setResults([]);
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
        { content: "", isImage: false },
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
                text: "Describe this image in excrutiating detail. The output will be used to generate the prompt on DALL-E so output only the DALL-E prompt.",
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
      <div>
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
    <div className="App flex min-h-screen flex-col items-center bg-gray-900 pt-6 font-sans text-white">
      <h1 className="mb-8 text-4xl font-bold">
        DALL-E 3 and GPT-4 Vision <br />
        Image Recursor
      </h1>
      <div className="mb-4">
        <label
          htmlFor="prompt"
          className="mb-2 block text-sm font-semibold text-gray-200"
        >
          Starting Image Prompt
        </label>
        <input
          id="prompt"
          type="text"
          className="focus:shadow-outline-blue w-96 rounded-lg border border-gray-600 bg-gray-700 p-2 text-white shadow-md focus:outline-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="imageCount"
          className="mb-2 block text-sm font-semibold text-gray-200"
        >
          Image Generation Count
        </label>
        <input
          id="count"
          type="number"
          className="focus:shadow-outline-blue w-full rounded-lg border border-gray-600 bg-gray-700 p-2 text-white shadow-md focus:outline-none"
          value={imageCount}
          onChange={(e) => {
            setImageCount(e.target.value);
          }}
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="apiKey"
          className="mb-2 block text-sm font-semibold text-gray-200"
        >
          API Key
        </label>
        <input
          id="api-key"
          type="password"
          className="focus:shadow-outline-blue w-full rounded-lg border border-gray-600 bg-gray-700 p-2 text-white shadow-md focus:outline-none"
          value={apiKey}
          onChange={(e) => {
            openai.apiKey = e.target.value;
            setApiKey(e.target.value);
          }}
        />
      </div>

      <button
        className="flex transform items-center justify-center rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white shadow-md transition duration-200 ease-in-out hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-0 active:scale-95 active:bg-blue-800"
        onClick={handleGenerate}
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
          <path d="m72.97,56.78l-15.81-6.9c-3.82-1.67-6.87-4.72-8.54-8.54l-6.9-15.81c-.54-1.23-2.27-1.23-2.81,0l-6.9,15.81c-1.67,3.82-4.72,6.87-8.54,8.54l-15.84,6.91c-1.22.53-1.23,2.27,0,2.81l16.11,7.12c3.81,1.69,6.85,4.75,8.5,8.58l6.68,15.51c.53,1.23,2.28,1.24,2.81,0l6.89-15.79c1.67-3.82,4.72-6.87,8.54-8.54l15.81-6.9c1.23-.54,1.23-2.27,0-2.81Z" />
          <path d="m92.76,26.84l-9.14-3.99c-2.21-.96-3.97-2.73-4.93-4.93l-3.99-9.14c-.31-.71-1.31-.71-1.62,0l-3.99,9.14c-.96,2.21-2.73,3.97-4.93,4.93l-9.15,3.99c-.71.31-.71,1.31,0,1.62l9.31,4.12c2.2.97,3.96,2.75,4.91,4.96l3.86,8.96c.31.71,1.32.71,1.63,0l3.98-9.12c.96-2.21,2.73-3.97,4.93-4.93l9.14-3.99c.71-.31.71-1.31,0-1.62Z" />
        </svg>
        Generate
      </button>
      {gifURL && (
        <div className="max-w-lg p-4 w-full text-center">
          <h1 className="font-black text-3xl pb-1">Result ✨</h1>
          <img src={gifURL} alt="Generated GIF" className="rounded-sm" />
        </div>
      )}
      <div className="my-4">{ResultsList()}</div>
    </div>
  );
}

export default App;

/* 
Todo
- Error Handling
- Advanced Options
- Start with an image url
- Advanced options (HD, Prompt etc.)
- Hide API Key
- Use table input format?
- About Tab?
*/
