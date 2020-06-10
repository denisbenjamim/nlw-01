import React, { useEffect, useState ,ChangeEvent, FormEvent} from 'react';
import logo from '../../assets/logo.svg';
import { Link , useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import Dropzone from '../../components/dropzone'
import './style.css'
import { LeafletMouseEvent } from 'leaflet';


interface Item {
    id: number,
    title: string,
    image_url: string,
}

interface IBEGEUFResponse {
    sigla: string;
}

interface IBEGECityResponse {
    nome: string;
}

const CreatePoint = () => {

    const [items,setItems] = useState<Item[]>([]);
    const [ufs,setUfs] = useState<string[]>([]);
    const [cities,setCities] = useState<string[]>([]);

    const [initialPosition,setInitialPosition] = useState<[number,number]>([0,0])

    const [formData,setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',        
    });

    const [selectedUf,setSelectedUf] = useState<string>('0');
    const [selectedCity,setSelectedCity] = useState<string>('0');
    const [selectedItems,setSelectedItems] = useState<number[]>([]);
    const [selectedPosition,setSelectedPosition] = useState<[number,number]>([0,0]);
    const [selectedFile,setSelectedFile] = useState<File>();

    const history = useHistory();
    useEffect(()=>{
        navigator.geolocation.getCurrentPosition(position =>{
            const { latitude , longitude }  = position.coords;           
            setInitialPosition([latitude,longitude]);
            setSelectedPosition([latitude,longitude]);
        });
    },[]);

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data)
        })
    },[]);

    useEffect(()=>{
        axios.get<IBEGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
        .then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);
            setUfs(ufInitials);
        });
    },[]);

    useEffect(()=>{
        axios.get<IBEGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
        .then(response => {
           const citiesNames = response.data.map(city => city.nome);          
           setCities(citiesNames);
        });
    },[selectedUf]);

    function handleSelectedUf(event:ChangeEvent<HTMLSelectElement>){
       setSelectedUf(event.target.value);
    }

    function handleSelectedCity(event:ChangeEvent<HTMLSelectElement>){
        setSelectedCity(event.target.value);
    }

    function handleMapClick(event:LeafletMouseEvent){
        setSelectedPosition([event.latlng.lat,event.latlng.lng]);       
    }

    function handleInputChange(event:ChangeEvent<HTMLInputElement>){
        const { name , value } = event.target;
        setFormData({...formData,[name]: value});
    }

    function handleselectedItem (id: number){
        const alreadySelected = selectedItems.findIndex(item=> item === id);

        if(alreadySelected >= 0){
            const filterdItems = selectedItems.filter(item => item !== id)
            setSelectedItems(filterdItems);
        }else{
            setSelectedItems([ ...selectedItems , id]);
        }
    }

   async function handleSubmit(event: FormEvent){
        event.preventDefault();
        const {name,email,whatsapp} = formData;
        const [latitude,longitude] = selectedPosition;
        const city = selectedCity;
        const uf = selectedUf;
        const items = selectedItems;
        

        const data = new FormData();

            data.append('name',name);
            data.append('email',email);
            data.append('whatsapp',whatsapp);
            data.append('latitude', String(latitude));
            data.append('longitude', String(longitude));
            data.append('city',city);
            data.append('uf',uf);
            data.append('items',items.join(','));  
            if(selectedFile)
                data.append('image',selectedFile);
            
        await api.post('points',data);
        alert('Sucesso!')
        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to="/">
                    <FiArrowLeft>
                        Voltar para home
                    </FiArrowLeft>
                </Link>            
            </header>
            <form onSubmit={handleSubmit}>
                <h1>
                    Cadastro do <br />ponto de coleta
                </h1>
                <Dropzone onFileUploaded={setSelectedFile} />
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input onChange={handleInputChange} type="text" name="name" id="name"/>
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input onChange={handleInputChange} type="email" name="email" id="email"/>
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input onChange={handleInputChange} type="text" name="whatsapp" id="whatsapp"/>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>
                    <Map center = {initialPosition} zoom={16} onclick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position = {selectedPosition} />
                    </Map>
                    <div className="field-group">

                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectedUf}>
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf =>(
                                    <option key={uf} value={uf} >{uf}</option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="city">Cidade (UF)</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectedCity}>
                                <option value="0">Selecione uma Cidade</option>
                                {cities.map(city =>(
                                    <option key={city} value={city} >{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item => ( 
                            <li key={item.id} className={selectedItems.includes(item.id) ? 'selected':''} onClick={() => handleselectedItem(item.id)}>
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li> 
                        ))}                                              
                    </ul>
                </fieldset>
                <button>Cadastrar ponto de coleta</button>
            </form>            
        </div>
    );
}
export default CreatePoint;