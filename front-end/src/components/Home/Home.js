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

    const onChangeFile = (e) => {
        setFile(e.target.files[0]);
        setFilename(e.target.files[0].name);
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
            

    useEffect(() => {
        if(!userData.user) history.push("/login")

    });

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
            <h2>Archivos Firmados</h2>
            <hr/>
            <h2>Archivos Encriptados</h2>

        </div>
    )
}
