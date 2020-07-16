import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createNativeWrapper } from 'react-native-gesture-handler';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  category: number;
  extras: Extra[];
}

const FoodDetails: React.FC<Params> = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const response = await api.get(`/foods/${routeParams.id}`);

      const foodDetail: Food = response.data;
      foodDetail.formattedPrice = formatValue(foodDetail.price);

      const extraFoodDetail = foodDetail.extras.map(extra => {
        return { ...extra, quantity: 0 };
      });

      setFood(foodDetail);
      setExtras(extraFoodDetail);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const updateExtras: Extra[] = extras.map(extra => {
      if (extra.id === id) {
        return { ...extra, quantity: extra.quantity + 1 };
      }
      return extra;
    });
    setExtras(updateExtras);
  }

  function handleDecrementExtra(id: number): void {
    const updateExtras: Extra[] = extras.map(extra => {
      if (extra.id === id) {
        if (extra.quantity <= 0) {
          return { ...extra, quantity: 0 };
        }

        return { ...extra, quantity: extra.quantity - 1 };
      }
      return extra;
    });
    setExtras(updateExtras);
  }

  function handleIncrementFood(): void {
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity <= 1) {
      setFoodQuantity(1);
      return;
    }
    setFoodQuantity(foodQuantity - 1);
  }

  const toggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);

    if (!isFavorite) {
      api.post('/favorites', food);
    } else {
      api.delete(`/favorites/${food.id}`);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const totalFood = food.price * foodQuantity;
    const totalExtra = extras.reduce((accumulator, extra) => {
      return accumulator + extra.value * extra.quantity * foodQuantity;
    }, 0);
    const total = totalFood + totalExtra;
    return total;
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const orderList = await api.get('/orders');

    await api.post('/orders', {
      id: orderList.data.length + 1,
      product_id: food.id,
      name: food.name,
      price: Number(food.price),
      quantity: foodQuantity,
      total: cartTotal,
      description: food.description,
      category: food.category,
      thumbnail_url: food.thumbnail_url,
      extras,
    });

    navigation.navigate('Orders');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">
              {formatValue(cartTotal)}
            </TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
