

import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/client';
import Editor from '../components/editor';
import { ColorRing } from 'react-loader-spinner'
import axios from "axios"
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const[codeOutput,setOutput]=useState(['']);
    const [loadingState,setLoadingState]=useState(false);
    const [selectedLanguage,setLanguage]=useState('JavaScript');

    const options = [
        'JavaScript', 'Python', 'C','Cpp'
      ];
      const code={
        JavaScript:'17',
        Python:'5',
        C:'6',
        Cpp:'7'
      }
      const defaultOption = options[0];

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();
        return () => {
            
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
            socketRef.current.disconnect();
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    // code compiling function
    function compileCode(){
        setOutput([''])
        // console.log(selectedLanguage)
        // console.log(code[`${selectedLanguage}`])
        if(codeRef.current){
        var options = {
            method: 'POST',
            url: 'https://code-compiler.p.rapidapi.com/v2',
            headers: {
              'content-type': 'application/x-www-form-urlencoded',
              'x-rapidapi-host': 'code-compiler.p.rapidapi.com',
              'x-rapidapi-key': 'b8132d3cb6mshe151c16cb42d60ep184351jsn6303b76a5a06'
            },
            data: {LanguageChoice:code[`${selectedLanguage}`],
               Program: `${codeRef.current}`}
              
              
              
              
          };
          
          axios.request(options).then(function (response) {
            setLoadingState(false)
            
            if(!response.data.Errors){
                if(response.data.Result){
                   let arro=response.data.Result.split('\n')
                   setOutput(arro)
                }

            }else{
                // console.log(response.data);
                setOutput(['error',response.data.Errors])
            }
          }).catch(function (error) {
            setOutput("Server error")
            console.error(error);
          });
          setLoadingState(true)
        }

    }

    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }
     

    function chnageLang(e){
        // console.log(e.value)
        setLanguage(e.value)

    }
    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                             src="/icon.png"
                             alt="code-sync-logo"
                        />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>

                <Dropdown options={options} onChange={chnageLang} value={defaultOption} placeholder="Select Language" className='dropdown'/>
                
                <button className='btn runCode' onClick={compileCode}>Run Code</button>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
                <div className="code-output">


                    <h1>Output:</h1>
{loadingState?
                    <ColorRing
  visible={true}
  height="80"
  width="80"
  ariaLabel="color-ring-loading"
  wrapperStyle={{}}
  wrapperClass="color-ring-wrapper"
  colors={['#024059', '#026873', '#04BF8A', '#025940', '#03A64A']}
  />
:<></>}
                    
                        {codeOutput[0]==='error'?<span className='codeOutputError'>{codeOutput[1]}</span>:codeOutput.map((el,i)=>{
                        return <p className='codeOutput' key={i}>{el}</p>

                        })}
                    

                 </div>
            </div>
            
        </div>
    );
};

export default EditorPage;