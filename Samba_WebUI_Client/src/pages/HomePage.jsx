import React, { useEffect, useState } from 'react';
import List from '../components/List';
import NavBar from '../components/NavBar';
import { API_BASE_URL } from '../APIs/APIBaseUrl';

const HomePage = () => {

    const [files, setFiles] = useState([])

    useEffect(() => {
        fetch(`${API_BASE_URL}/files`)
        .then(res => res.json())
        .then(data => {
            setFiles(data);
        })
        .catch(err => console.log(err))
    }, [])

    return (
        <div>
            <NavBar></NavBar>
          <div className='w-[80%] m-auto'>
            {
                files.map((file, index) => <List file={file} index={index} key={index}></List>)
            }
        </div>  
        </div>
        
    );
};

export default HomePage;