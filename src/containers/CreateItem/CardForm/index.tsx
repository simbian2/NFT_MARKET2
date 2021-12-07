import Input from './Input';
import { create } from 'ipfs-http-client';
import { useDropzone } from 'react-dropzone';
import React from 'react';
import { useRecoilValue } from 'recoil';
import walletAccountAtom from '../../../atoms/walletAccount';
import Textarea from './Textarea';
import NFTCollection from '../../../abis/NFT.json';
import contracts from '../../../constants/contracts';
import { utils } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import web3 from '../../../connection/web3';
import { AbiItem } from 'web3-utils';

const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
});

const CardForm = ({ data }: { data: any }) => {
  const walletAccount = useRecoilValue(walletAccountAtom);

  const [capturedFileBuffer, setCapturedFileBuffer] =
    React.useState<Buffer | null>(null);
  const [title, setTitle] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [ipfsImage, setIpfsImage] = React.useState<string>('');
  const [agree, setAgree] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const onDrop = React.useCallback((files: any) => {
    setBuffer(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const captureFile: React.ChangeEventHandler<HTMLInputElement> = (
    event: any
  ) => {
    event.preventDefault();

    const file = event.target.files[0];

    setBuffer(file);
  };

  const setBuffer = (file: any) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      // @ts-ignore
      setCapturedFileBuffer(Buffer(reader.result));
    };
  };

  const onSubmit = async () => {
    if (!capturedFileBuffer) {
      console.log('!capturedFileBuffer');
      return;
    }

    if (isLoading) {
      console.log('isLoading');
      return;
    }

    setIsLoading(true);

    const fileAdded = await ipfs.add(capturedFileBuffer);

    const metadata = {
      title: 'Asset Metadata',
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: title,
        },
        description: {
          type: 'string',
          description: description,
        },
        image: {
          type: 'string',
          description: fileAdded.path,
        },
      },
    };

    const metadataAdded = await ipfs.add(JSON.stringify(metadata));
    if (!metadataAdded) {
      console.error('Something went wrong when updloading the file');
      return;
    }

    console.log('metadataAdded');
    console.log(metadataAdded);

    contracts.nftContract.methods
      .mintNFT(metadataAdded.path)
      .send({ from: walletAccount });

    setIsLoading(false);
  };

  return (
    <div className="card-body">
      <form>
        <div className="mt-2 position-relative">
          <p className="text-sm font-weight-bold mb-15 text-secondary text-border d-inline z-index-2 bg-white">
            Upload File
          </p>
        </div>
        <div className="upload-div" {...getRootProps()}>
          <button className="btn btn-outline-primary btn-sm mb-0">
            {isDragActive ? 'Drop the files here ...' : 'Upload Item File'}
          </button>
          <input
            type="file"
            name="upload"
            id="upload-btn"
            required
            onChange={captureFile}
            {...getInputProps()}
          />
        </div>

        <Input
          placeholder="Item Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Item Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="form-check form-check-info text-left">
          <input
            id="agree"
            className="form-check-input"
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <label htmlFor="agree" className="form-check-label">
            Transfer Copyright When Purchased?
          </label>
        </div>
        <div className="text-center">
          <button
            type="button"
            className="btn bg-gradient-dark w-100 my-4 mb-2"
            onClick={onSubmit}
          >
            List Item Now
          </button>
        </div>
      </form>
    </div>
  );
};

export default CardForm;