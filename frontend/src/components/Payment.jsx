import { ethers } from "ethers";
import { useEffect, useState } from "react";
import ERC20 from "../artifacts/ERC20.json";
import Disperse from "../artifacts/Disperse.json";
import Confirm from "./Confirm";
import Recipients from "./Recipients";

const DISPERSE_ADDRESS =
  import.meta.env.VITE_DISPERSE_ADDRESS ||
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const Payment = ({ address }) => {
  const [currentLink, setCurrentLink] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenDetails, setTokenDetails] = useState({
    name: null,
    symbol: null,
    balance: null,
  });
  const [textValue, setTextValue] = useState("");
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [recipientsData, setRecipientsData] = useState([]);
  const [total, setTotal] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isDisperseSuccessful, setIsDisperseSuccessful] = useState(false);

  const getEthBalance = async (ethereum) => {
    if (!ethBalance) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      let ethBalance = await provider.getBalance(address);
      ethBalance = ethers.utils.formatEther(ethBalance);
      setEthBalance(ethBalance);
    }
  };

  const loadToken = async () => {
    try {
      setIsTokenLoading(true);
      const { ethereum } = window;
      if (ethereum && tokenAddress !== "") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const erc20 = new ethers.Contract(tokenAddress, ERC20.abi, signer);
        const name = await erc20.name();
        const symbol = await erc20.symbol();
        const balance = await erc20.balanceOf(address);
        setTokenDetails({
          name,
          symbol,
          balance: ethers.utils.formatEther(balance),
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsTokenLoading(false);
    }
  };

  useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      getEthBalance(ethereum);
    }
  }, [currentLink]);

  const isValidAddress = (address) => ethers.utils.isAddress(address);

  const isValidValue = (value) => {
    try {
      return ethers.utils.parseUnits(value, "ether");
    } catch (err) {
      return false;
    }
  };

  const parseText = () => {
    const lines = textValue.split("\n");
    let updatedRecipients = [];

    lines.map((line) => {
      if (line.includes("=")) {
        const [address, value] = line.split("=");
        const validValue = isValidValue(value);
        if (isValidAddress(address) && validValue) {
          updatedRecipients.push({
            address,
            value: validValue,
          });
        }
      }
    });

    setRecipientsData(updatedRecipients);
  };

  const approve = async () => {
    setIsApproved(false);
    setIsDisperseSuccessful(false);
    try {
      const { ethereum } = window;
      if (ethereum && tokenAddress !== "" && total) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const erc20 = new ethers.Contract(tokenAddress, ERC20.abi, signer);

        const approve = await erc20.approve(DISPERSE_ADDRESS, total);
        if (approve) {
          setIsApproved(true);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const disperse = async () => {
    try {
      const { ethereum } = window;
      if (ethereum && tokenAddress !== "" && recipientsData.length > 0) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const disperse = new ethers.Contract(
          DISPERSE_ADDRESS,
          Disperse.abi,
          signer
        );

        const recipients = recipientsData.map((recipient) => recipient.address);
        const values = recipientsData.map((recipient) => recipient.value);

        const disperseToken = await disperse.disperseToken(
          tokenAddress,
          recipients,
          values
        );

        if (disperseToken) {
          setIsDisperseSuccessful(true);
        }

        // const disperseToken = await disperse.
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (textValue !== "") {
      parseText();
    }
  }, [textValue]);

  useEffect(() => {
    if (recipientsData.length > 0) {
      let newTotal = recipientsData[0].value;
      for (let i = 1; i < recipientsData.length; i++) {
        newTotal = newTotal.add(recipientsData[i].value);
      }
      setTotal(newTotal);
    } else {
      setTotal(null);
    }
  }, [recipientsData]);

  useEffect(() => {
    if (tokenDetails.balance && total) {
      const tokenBalance = ethers.utils.parseEther(tokenDetails.balance);
      const remaining = tokenBalance.sub(total);
      setRemaining(ethers.utils.formatEther(remaining));
    } else {
      setRemaining(null);
    }
  }, [total]);

  return (
    <div className="pt-16">
      <h3 className="text-2xl font-light italic">
        send
        <span
          onClick={() => setCurrentLink("ether")}
          className={`border-gray-600 border-b-2 ${
            currentLink !== "ether" ? "text-gray-500" : ""
          }`}
        >
          {" "}
          ether{" "}
        </span>
        or
        <span
          onClick={() => setCurrentLink("token")}
          className={`border-gray-600 border-b-2 ${
            currentLink !== "token" ? "text-gray-500" : ""
          }`}
        >
          {" "}
          token
        </span>
      </h3>

      {currentLink === "ether" && (
        <p className="pt-4 text-l font-light italic">
          you have {ethBalance} <span className="pt-1 text-sm">ETH</span>
        </p>
      )}
      {currentLink === "token" && (
        <div className="mt-12 mb-24">
          <h3 className="text-2xl font-light italic">token address</h3>
          <div className="flex mt-6">
            <input
              type="text"
              className="text-l py-2 px-1 border-b-2 border-black outline-none"
              placeholder="0x2b1F577230F4D72B3818895688b66abD9701B4dC"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              style={{
                width: "80%",
                background: "aquamarine",
                color: "#768882",
              }}
            />
            <button
              onClick={loadToken}
              className="ml-4 px-2"
              style={{
                background: "aquamarine",
                boxShadow: "6px 6px crimson",
              }}
            >
              load
            </button>
          </div>
          {isTokenLoading && (
            <p className="pt-4 text-l font-light italic">
              loading token info ...
            </p>
          )}
          {!isTokenLoading && tokenDetails.name && (
            <>
              <p className="pt-4 text-l font-light">
                you have {tokenDetails.balance}{" "}
                <span className="pt-1 text-xs">{tokenDetails.symbol}</span> (
                {tokenDetails.name})
              </p>
              <Recipients
                tokenSymbol={tokenDetails.symbol}
                textValue={textValue}
                setTextValue={setTextValue}
              />
              {recipientsData.length > 0 && (
                <Confirm
                  recipientsData={recipientsData}
                  total={total}
                  tokenBalance={tokenDetails.balance}
                  remaining={remaining}
                  approve={approve}
                  isApproved={isApproved}
                  disperse={disperse}
                  isDisperseSuccessful={isDisperseSuccessful}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Payment;