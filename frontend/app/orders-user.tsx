import React,{useEffect,useState} from "react";
import {
View,
Text,
ScrollView
} from "react-native";


const API="https://devapi.intownlocal.com";


export default function MyOrders(){


const customerId=100068;


const [orders,setOrders]=useState<any[]>([]);



useEffect(()=>{

loadOrders();

},[]);



const loadOrders=async()=>{


const res=await fetch(

`${API}/IN/customers/${customerId}/pickup-orders`

);


const data=await res.json();


console.log(
"MY ORDERS",
data
);


setOrders(data);


};





return(

<ScrollView
style={{padding:20}}
>


<Text
style={{fontSize:25}}
>
My Orders
</Text>



{
orders.map(order=>(


<View
key={order.pickup_id}
style={{
borderWidth:1,
padding:10,
margin:10
}}
>


<Text>
Status : {order.status}
</Text>


<Text>
Merchant : {order.merchantId}
</Text>



{
order.items?.map((item:any)=>(


<Text key={item.id}>

{item.productName}

-

{item.quantity}

</Text>


))

}



</View>


))

}



</ScrollView>


)

}

