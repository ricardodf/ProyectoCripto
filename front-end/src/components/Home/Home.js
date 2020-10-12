import React, { useEffect, useContext, useState } from 'react'
import { useHistory } from 'react-router-dom'
import UserContext from '../../context/UserContext'
import Axios from 'axios'

export default function Home() {
    const { userData } = useContext(UserContext);
    const history = useHistory();

    const [file, setFile] = useState();
    const [filename, setFilename] = useState('Seleccionar Archivo');
    const [uploadedFile, setUploadedFile] = useState({});

    const [file_enc, setFile_enc] = useState();
    const [filename_enc, setFilename_enc] = useState('Seleccionar Archivo');
    const [uploadedFile_enc, setUploadedFile_enc] = useState({});

    const [signedFiles, setSignedFiles] = useState([])
    const [encryptedFiles, setEncryptedFiles] = useState([])
    const [secretMessage, setSecretMessage] = useState()

    const onChangeFile = (e) => {
        setFile(e.target.files[0]);
        setFilename(e.target.files[0].name);
    }

    const onChangeFile_enc = (e) => {
        setFile_enc(e.target.files[0]);
        setFilename_enc(e.target.files[0].name);
    }

    const submit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await Axios.post('http://localhost:5000/doc/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'auth-token': localStorage.getItem('auth-token')
                }
            });
            const { fileName } = res.data;
            setUploadedFile({ fileName });
        } catch(err){
            if(err.response.status === 500)
                console.log('500 Error (Server')
            else
                console.log(err.response.data.msg);
        }

        try {
            const res = await Axios.post('http://localhost:5000/doc/sign', 
                formData, 
                { headers: { 'auth-token': localStorage.getItem('auth-token') } }
            );
            const { fileName, qrcode } = res.data;
            setUploadedFile({ fileName: fileName, qrcode: qrcode });
        } catch(err){
            if(err.response.status === 500)
                console.log('500 Error (Server')
            else
                console.log(err.response.data.msg);
        }
    }

    const submit_enc = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', file_enc);

        try {
            const res = await Axios.post('http://localhost:5000/doc/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'auth-token': localStorage.getItem('auth-token')
                }
            });
            const { fileName_enc } = res.data;
            setUploadedFile_enc({ fileName_enc });
        } catch(err){
            if(err.response.status === 500)
                console.log('500 Error (Server')
            else
                console.log(err.response.data.msg);
        }

        try {
            const res = await Axios.post('http://localhost:5000/doc/encrypt', 
                formData, 
                { headers: { 'auth-token': localStorage.getItem('auth-token') } }
            );
            const { fileName_enc } = res.data;
            setUploadedFile_enc({ fileName_enc: fileName_enc });
        } catch(err){
            if(err.response.status === 500)
                console.log('500 Error (Server')
            else
                console.log(err.response.data.msg);
        }
    }
    
    const onSignedFilesButton = async (e) => {
        e.preventDefault();

        try {
            const res = await Axios.get('http://localhost:5000/doc/signed/all',
                { headers: { 'auth-token': localStorage.getItem('auth-token') } }
            );
            setSignedFiles(res.data);
        } catch(err){
            if(err.response.status === 500)
                console.log('500 Error (Server')
            else
                console.log(err.response.data.msg);
        }
    }

    const onEncryptedFilesButton = async (e) => {
        e.preventDefault();

        try {
            const res = await Axios.get('http://localhost:5000/doc/encrypted/all',
                { headers: { 'auth-token': localStorage.getItem('auth-token') } }
            );
            setEncryptedFiles(res.data);
        } catch(err){
            if(err.response.status === 500)
                console.log('500 Error (Server')
            else
                console.log(err.response.data.msg);
        }
    }

    useEffect(() => {
        if(!userData.user) history.push("/login")

    });

    const onShowQRCode = (name) => {
        setSignedFiles( signedFiles.map( (file) => {
            var current = file;
            if(current.name === name){
                current.isHidden = !current.isHidden
            }
            return current;
        }))
    }

    const onGetSecret = async (name) => {
        const formData = new FormData()
        formData.append('encryptedFilename', name)
        try {
            const res = await Axios.post('http://localhost:5000/doc/decrypt',
                formData,
                { headers: { 'auth-token': localStorage.getItem('auth-token') } }
            );
            setSecretMessage(res.data.secret);
        } catch(err){
            if(err.response.status === 500)
                console.log('500 Error (Server')
            else
                console.log(err.response.data.msg);
        }
    }


    return (
        <div className="page">
            <h2>Firmar Archivo</h2>
            <form onSubmit={submit}>
                <div className="custom-file">
                    <input type="file" className="custom-file-input" id="customFile" onChange={onChangeFile}/>
                    <label className="custom-file-label" htmlFor="customFile">{filename}</label>
                </div>
                <input type="submit" value="Upload" className="btn btn-primary btn-block mt-4" />
            </form>
            { uploadedFile.qrcode ? (
                <div >
                    <h4>{uploadedFile.fileName} Verified</h4>
                    <img src={uploadedFile.qrcode} alt="This is the QR Code"></img>
                </div>
            ):(
                null
            )}
            <hr/>
            <h4>Archivos Firmados</h4>
            <input type="submit" value="Ver mis archivos firmados" className="btn btn-success btn-block mt-4" onClick={onSignedFilesButton}/>
            {
                signedFiles.length > 0 ? (
                    <>
                        <br/>
                        {signedFiles.map((file, index) => (
                            <div key={index}>
                                <input type="submit" value={file.name.replace('-qr', '')} className="btn btn-secondary btn-block mt-2" onClick={() => {onShowQRCode(file.name)}}/>
                                {
                                    file.isHidden === false ? (
                                        <img src={file.qrcode} alt="This is the QR Code" key={'img-'+{index}}></img>
                                    ):(
                                        null
                                    )
                                }
                            </div>
                        ))}
                    </>
                ):(
                    null
                )
            }

            <br/><br/>

            <h2>Encriptar Archivo</h2>
            <form onSubmit={submit_enc}>
                <div className="custom-file">
                    <input type="file" className="custom-file-input" id="customFile" onChange={onChangeFile_enc}/>
                    <label className="custom-file-label" htmlFor="customFile">{filename_enc}</label>
                </div>
                <input type="submit" value="Upload" className="btn btn-primary btn-block mt-4" />
            </form>
            <hr/>
            <h4>Archivos Encriptados</h4>
            <input type="submit" value="Ver mis archivos encriptados" className="btn btn-success btn-block mt-4" onClick={onEncryptedFilesButton}/>
            {
                encryptedFiles.length > 0 ? (
                    <>
                        <br/>
                        {encryptedFiles.map((file, index) => (
                            <div key={index}>
                                <input type="submit" value={file.name.replace('-encrypted', '')} className="btn btn-secondary btn-block mt-2" onClick={() => {onGetSecret(file.name)}}/>
                            </div>
                        ))}
                        {
                            secretMessage ? (
                                <>
                                    <h3>Mensaje Secreto es...</h3>
                                    <p>{secretMessage}</p>
                                </>
                            ):(
                                null
                            ) 
                        }
                    </>
                ):(
                    null
                )
            }

        </div>
    )
}
