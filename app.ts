import nacl from "tweetnacl";
import bs58 from "bs58";

function getOrCreateDappKeyPair() {
    const saved = localStorage.getItem('dappKeyPair')
    if (saved === null) {
        const dappKeyPair = nacl.box.keyPair()
        localStorage.setItem('dappKeyPair', bs58.encode(dappKeyPair.secretKey))
        return dappKeyPair
    } else {
        return nacl.box.keyPair.fromSecretKey(bs58.decode(saved))
    }
}

function createConnectUrl(dappKeyPair: nacl.BoxKeyPair) {
    const baseURL = window.location.origin
    const params = new URLSearchParams({
        app_url: baseURL,
        dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
        redirect_link: baseURL
    })
    return `https://phantom.app/ul/v1/connect?${params.toString()}`
}

function parseConnectResponse(dappKeyPair: nacl.BoxKeyPair) {
    const { phantom_encryption_public_key, nonce, data } = Object.fromEntries(new URLSearchParams(window.location.search))

    const phantomPublicKey = bs58.decode(phantom_encryption_public_key!)
    const nonceBytes = bs58.decode(nonce!)
    const encryptedData = bs58.decode(data!)

    const decryptedBytes = nacl.box.open(encryptedData, nonceBytes, phantomPublicKey, dappKeyPair.secretKey)
    const decrypted = new TextDecoder().decode(decryptedBytes!)
    return JSON.parse(decrypted)
}

function connectWallet(dappKeyPair: nacl.BoxKeyPair, walletElement: HTMLElement, imgElement: HTMLElement) {
    try {
        const { public_key, session }: { public_key: string, session: string } = parseConnectResponse(dappKeyPair)
        localStorage.setItem('dappSession', session)
        localStorage.setItem('dappWallet', public_key)
        walletElement.innerText = `Player: ${public_key.slice(0,4)}...${public_key.slice(-4)}`
        imgElement.style.opacity = '1'
    } catch (err) {
        console.error(err)
    }
}

const dappKeyPair = getOrCreateDappKeyPair()

const link = document.querySelector('#connect') as HTMLAnchorElement
link.href = createConnectUrl(dappKeyPair)

const walletElement = document.querySelector('#wallet') as HTMLElement
const imgElement = document.querySelector('img') as HTMLElement
connectWallet(dappKeyPair, walletElement, imgElement)

// reseting
document.querySelector('#reset-data')?.addEventListener('click', (e) => {
    localStorage.clear()
})